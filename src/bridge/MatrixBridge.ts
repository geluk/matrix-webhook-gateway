import {
  Bridge, MatrixUser, WeakEvent, Request, Intent,
} from 'matrix-appservice-bridge';

import MatrixEventHandler from './MatrixEventHandler';
import EventContext from './EventContext';
import logger, { forwardMatrixLog } from '../util/logger';
import AppServiceConfiguration from '../configuration/AppServiceConfiguration';
import UserRepository from '../repositories/UserRepository';
import PrivateRoomCollection from './PrivateRoomCollection';

export default class MatrixBridge {
  private bridge: Bridge;

  private eventHandlers: MatrixEventHandler[] = [];

  private privateRoomCollection: PrivateRoomCollection;

  public constructor(
    private config: AppServiceConfiguration,
    private userRepository: UserRepository,
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
    message: string,
    sender?: string | undefined,
  ): Promise<unknown> {
    return this.getIntent(sender).sendMessage(target, {
      body: message,
      msgtype: 'm.text',
    });
  }

  public getIntent(userId: string | undefined): Intent {
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

  public async leaveRoom(userId: string, roomId: string): Promise<unknown> {
    return this.bridge.getIntentFromLocalpart(userId).leave(roomId);
  }

  public async sendSecret(target: string, message: string): Promise<unknown> {
    const room = await this.privateRoomCollection.getPrivateRoom(target);
    return this.sendMessage(room, message);
  }

  public registerHandler(eventHandler: MatrixEventHandler): void {
    this.eventHandlers.push(eventHandler);
  }

  public start(): void {
    logger.silly('Starting Matrix bridge');
    this.bridge.run(this.config.listen_port, undefined, undefined, this.config.listen_host);
    logger.info(`Matrix bridge running on ${this.config.listen_host}:${this.config.listen_port}`);
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
          logger.info(`Event ignored: ${event.type}`);
        }
      })
      .catch((error) => {
        logger.error('An error occurred while processing a Matrix event:');
        logger.prettyError(error, true, false, true, 0);
      });
  }
}
