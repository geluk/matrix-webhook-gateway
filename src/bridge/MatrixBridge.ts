import {
  Bridge, MatrixUser, WeakEvent, Request, Intent,
} from 'matrix-appservice-bridge';
import { is } from 'typescript-is';

import MatrixEventHandler from './events/MatrixEventHandler';
import EventContext from './events/EventContext';
import logger, { forwardMatrixLog } from '../util/logger';
import AppServiceConfiguration from '../configuration/AppServiceConfiguration';
import UserRepository from '../repositories/UserRepository';
import PrivateRoomCollection from './PrivateRoomCollection';
import { EmojiIcon, UrlIcon } from '../webhooks/formats';
import ImageUploader from './ImageUploader';
import { CachedImageRepository } from '../repositories/CachedImageRepository';
import {
  fmt, Text, toHtml, toPlain,
} from '../formatting/formatting';
import ProfileInfo from './ProfileInfo';
import downloader from '../downloads/downloader';

export default class MatrixBridge {
  private bridge: Bridge;

  private eventHandlers: MatrixEventHandler[] = [];

  private privateRoomCollection: PrivateRoomCollection;

  public constructor(
    private config: AppServiceConfiguration,
    private imageRepository: CachedImageRepository,
    userRepository: UserRepository,
  ) {
    this.bridge = new Bridge({
      homeserverUrl: config.homeserver_url,
      domain: config.homeserver_name,
      registration: config.toAppServiceRegistration(),
      disableStores: true,
      logRequestOutcome: false,
      controller: {
        onUserQuery: this.handleUserQuery.bind(this),
        onLog: forwardMatrixLog,
        onEvent: this.handleEvent.bind(this),
      },
    });
    this.privateRoomCollection = new PrivateRoomCollection(userRepository, this.bridge);
  }

  public async sendMessage(
    target: string,
    message: Text,
    sender?: string | undefined,
  ): Promise<unknown> {
    const plain = toPlain(message);
    const html = toHtml(message);

    const event: Record<string, unknown> = {
      body: plain,
      msgtype: 'm.text',
    };
    if (typeof message !== 'string' && plain !== html) {
      event.format = 'org.matrix.custom.html';
      event.formatted_body = html;
    }
    return this.getIntent(sender).sendMessage(target, event);
  }

  public getIntent(userId?: string): Intent {
    if (userId === undefined) {
      return this.bridge.getIntent();
    }
    logger.debug(`Looking up intent for '${userId}'`);
    return this.bridge.getIntentFromLocalpart(userId);
  }

  public async tryJoinRoom(userId: string, roomId: string): Promise<boolean> {
    logger.debug(`Adding ${userId} to room ${roomId}`);
    try {
      // We could be smarter about this, by checking the room permissions
      // ourselves, and then taking the appropriate action (direct join if
      // anyone is allowed to join, invite if the bot user may send invites,
      // fail when neither are true).
      await this.bridge.getIntentFromLocalpart(userId).join(roomId);
      return true;
    } catch {
      logger.debug(`Unable to add ${userId} to room ${roomId}`);
      return false;
    }
  }

  // This method is not async because it makes more sense to handle errors
  // in here, as failure to send a typing event is not a failure condition
  // any of our callers are interested about. Instead, we just log it.
  public sendTyping(roomId: string, typing: boolean): void {
    this.bridge.getIntent().sendTyping(roomId, typing)
      .catch((error) => {
        logger.warn('Unable to send typing event:', error);
      });
  }

  public async leaveRoom(userId: string, roomId: string): Promise<unknown> {
    try {
      return await this.bridge.getIntentFromLocalpart(userId).leave(roomId);
    } catch (error) {
      if ((error.message as string).indexOf('not in room') < 0) {
        throw error;
      }
      logger.debug(`User ${userId} already left ${roomId}, leave not necessary`);
      return undefined;
    }
  }

  public async setProfileDetails(
    userId?: string,
    username?: string,
    icon?: EmojiIcon | UrlIcon | 'clear',
  ): Promise<void> {
    const intent = this.getIntent(userId);
    if (username) {
      await intent.setDisplayName(username);
    }
    if (icon === 'clear') {
      await intent.setAvatarUrl('');
    } else if (is<UrlIcon>(icon)) {
      if (icon.url.startsWith('mxc://')) {
        await intent.setAvatarUrl(icon.url);
      } else {
        const client = new ImageUploader(intent.getClient(), downloader, this.imageRepository);
        const result = await client.uploadImage(icon.url);
        if (result) {
          await intent.setAvatarUrl(result);
        }
      }
    }
  }

  async getProfileInfo(userId: string): Promise<ProfileInfo> {
    const intent = this.bridge.getIntentFromLocalpart(userId);
    const profile = await intent.getProfileInfo(intent.userId) as {
      displayname: string,
      avatar_url: string,
    };
    return {
      id: intent.userId,
      displayname: profile.displayname,
      avatarUrl: profile.avatar_url,
    };
  }

  public async sendSecret(userId: string, ...message: Text[]): Promise<unknown> {
    const room = await this.privateRoomCollection.getPrivateRoom(userId);
    return this.sendMessage(room, fmt(...message));
  }

  public registerHandler(eventHandler: MatrixEventHandler): void {
    this.eventHandlers.push(eventHandler);
  }

  public async start(): Promise<void> {
    logger.silly('Starting Matrix bridge');
    await this.bridge.run(this.config.listen_port, undefined, undefined, this.config.listen_host);
    logger.info(`Matrix bridge running on ${this.config.listen_host}:${this.config.listen_port}`);
    await this.getIntent().ensureRegistered(true);

    const icon = this.config.bot_avatar_url ? {
      url: this.config.bot_avatar_url,
    } : 'clear';

    await this.setProfileDetails(undefined, this.config.bot_user_name, icon);
  }

  private handleUserQuery(user: MatrixUser): Record<string, unknown> {
    logger.info(`User provision requested: ${user.localpart}:${user.host}`);
    return {};
  }

  private handleEvent(request: Request<WeakEvent>) {
    const event = request.getData();
    const context = new EventContext(event, this.bridge);

    Promise.all(this.eventHandlers.map(async (h) => h.handleEvent(context)))
      .then((results) => {
        const handled = results.reduce((p, c) => p || c);
        if (!handled) {
          logger.debug(`Event ignored: ${event.type} from ${event.sender} in ${event.room_id}, state: ${event.state_key} content:`);
          logger.silly(event.content);
        }
      })
      .catch((error) => {
        logger.error('An error occurred while processing a Matrix event:');
        logger.prettyError(error, true, false, true, 0);
      });
  }
}
