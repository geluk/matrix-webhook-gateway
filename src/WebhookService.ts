import CommandHandler from './commands/CommandHandler';
import MatrixBridge from './bridge/MatrixBridge';
import MatrixEventHandlers from './bridge/events/MatrixEventHandlers';
import logger from './util/logger';
import Database from './repositories/Database';
import WebhookRepository from './repositories/WebhookRepository';
import {
  Command, CreateWebhookCommand, DeleteWebhookCommand, ListWebhookCommand,
  RotateWebhookCommand, SetWebhookPropertyCommand,
} from './commands/CommandParser';
import randomString from './util/randomString';
import WebhookListener from './webhooks/WebhookListener';
import Configuration from './configuration/Configuration';
import { generateLocalPart } from './util/matrixUtilities';
import UserRepository from './repositories/UserRepository';
import { WebhookResult } from './webhooks/pluginApi';
import Matcher from './webhooks/Matcher';
import UploadedImageFromDatabase from './repositories/UploadedImageRepository';
import {
  br, code, fmt, room, table, Text, user,
} from './formatting/formatting';
import HookCallRepository from './repositories/HookCallRepository';

const HOOK_SECRET_LENGTH = 48;

export default class WebhookService {
  database: Database;

  config: Configuration;

  webhookRepository: WebhookRepository;

  userRepository: UserRepository;

  bridge: MatrixBridge;

  commandHandler = new CommandHandler();

  webhookListener: WebhookListener;

  public constructor(database: Database, config: Configuration) {
    this.database = database;
    this.config = config;

    this.webhookRepository = new WebhookRepository(this.database);
    this.userRepository = new UserRepository(this.database);
    const imageRepository = new UploadedImageFromDatabase(this.database);
    const hookCallRepository = new HookCallRepository(this.database);

    this.bridge = new MatrixBridge(config.app_service, imageRepository, this.userRepository);
    this.commandHandler.onCommand.observe(this.handleCommand.bind(this));
    this.webhookListener = new WebhookListener(
      config.webhooks,
      new Matcher(this.webhookRepository, this.config.webhooks, this.bridge),
      hookCallRepository,
    );
    this.webhookListener.onWebhookResult.observe(this.handleHookResult.bind(this));
  }

  private async handleCommand(command: Command) {
    switch (command.parameters.type) {
      case 'createWebhook':
        await this.createWebhook(command.parameters, command);
        break;
      case 'listWebhook':
        await this.listWebhook(command.parameters, command);
        break;
      case 'deleteWebhook':
        await this.deleteWebhook(command.parameters, command);
        break;
      case 'rotateWebhook':
        await this.rotateWebhook(command.parameters, command);
        break;
      case 'setWebhookProperty':
        await this.setWebhookProperty(command.parameters, command);
        break;
      default:
        break;
    }
  }

  private async handleHookResult(call: WebhookResult): Promise<void> {
    await this.bridge.setProfileDetails(
      call.webhook.user_id,
      call.content.username,
      call.content.icon,
    );

    if ('format' in call.content && call.content.format === 'html') {
      const content: Record<string, unknown> = {
        body: call.content.text,
        msgtype: 'm.text',
      };
      content.format = 'org.matrix.custom.html';
      content.formatted_body = call.content.text;
      await this.bridge.getIntent(call.webhook.user_id).sendMessage(call.webhook.room_id, content);
    } else {
      await this.bridge.sendMessage(call.webhook.room_id, call.content.text);
    }
  }

  private async createWebhook(command: CreateWebhookCommand, context: Command) {
    logger.debug('Creating a new webhook');
    logger.silly(command);
    const userId = generateLocalPart(
      this.config.app_service.user_pattern,
      command.webhook_user_id,
      context.message.event.room_id,
    );

    const webhook = {
      path: `/hook/${randomString(HOOK_SECRET_LENGTH)}`,
      user_id: userId,
      room_id: context.message.event.room_id,
    };
    logger.silly('Webhook:', webhook);

    // Setting up a new webhook generates quite a sequence of events, which can
    // take a moment to be processed. Sending a typing notification provides
    // immediate feedback that we're working on it.
    this.bridge.sendTyping(webhook.room_id, true);
    if (!await this.bridge.tryJoinRoom(webhook.user_id, webhook.room_id)) {
      logger.debug(`${webhook.user_id} was unable to join ${webhook.room_id}`);
      context.reply('I am unable to invite a webhook user to this room.\n'
        + 'Please make sure I am allowed to invite users, then try again.');
      return;
    }

    await this.webhookRepository.add(webhook);
    logger.debug('Webhook created successfully');

    const profile = await this.bridge.getProfileInfo(webhook.user_id);

    const secret = this.bridge.sendSecret(context.message.event.sender,
      'Your webhook for ', user(profile), ' in ', room(context.message.event.room_id), ' was created.', br(),
      'URL: ', code(`${this.config.webhooks.public_url}${webhook.path}`));
    const reply = context.reply(
      'I\'ve sent you a message with your webhook details.', br(),
      'To set the avatar and displayname of the user, post a webhook or use the ',
      code('-hook set'),
      'command.',
    );

    this.bridge.sendTyping(webhook.room_id, false);
    await Promise.all([secret, reply]);
  }

  private async deleteWebhook(command: DeleteWebhookCommand, context: Command) {
    const webhook = await this.webhookRepository.getById(command.webhook_id);
    if (webhook) {
      const allHooks = await this.webhookRepository.findByRoom(webhook.room_id, webhook.user_id);
      if (allHooks.length === 1) {
        logger.debug(`Last webhook for ${webhook.user_id} in ${webhook.room_id} deleted, leaving.`);
        try {
          await this.bridge.leaveRoom(webhook.user_id, webhook.room_id);
        } catch (error) {
          logger.error(`Failed to leave room: ${error}`);
        }
      }
    }
    const removed = await this.webhookRepository
      .deleteFromRoom(command.webhook_id, context.message.event.room_id);
    if (removed) {
      context.reply('Webhook deleted.');
    } else {
      context.reply('Webhook ', code(`#${command.webhook_id}`), ' not found in this room.');
    }
  }

  private async rotateWebhook(command: RotateWebhookCommand, context: Command) {
    const webhook = await this.webhookRepository.getById(command.webhookId);
    if (webhook) {
      webhook.path = `/hook/${randomString(HOOK_SECRET_LENGTH)}`;
      await this.webhookRepository.update(webhook);
      const secret = this.bridge.sendSecret(context.message.event.sender, `Your webhook for ${webhook.user_id} in ${context.message.event.room_id} was rotated.\n `
      + `URL: ${this.config.webhooks.public_url}${webhook.path}`);

      this.bridge.sendTyping(webhook.room_id, false);
      const reply = context.reply('I\'ve sent you a message with your webhook details.');

      await Promise.all([secret, reply]);
    } else {
      context.reply('That webhook does not exist.');
    }
  }

  private async listWebhook(command: ListWebhookCommand, context: Command) {
    let roomId = context.message.event.room_id;
    let roomDescription: Text = 'this room';
    if (command.roomId) {
      roomId = await this.bridge.getIntent().resolveRoom(command.roomId);
      roomDescription = room(roomId);
    }

    const hooks = await this.webhookRepository.findByRoom(roomId);
    if (hooks.length === 0) {
      context.reply('No hooks active in ', roomDescription, '.', br(),
        'To view webhooks from a different room, try ', code('-hook list [full] <room_id>'));
      return;
    }
    if (command.full) {
      const rows: Text[][] = await Promise.all(hooks.map(async (h) => {
        const profile = await this.bridge.getProfileInfo(h.user_id);
        return [`#${h.id}`, fmt(user(profile)), code(`${this.config.webhooks.public_url}${h.path}`)];
      }));

      const message = fmt(
        'The following webhooks are active in ', roomDescription, '\n',
        table(['Hook', 'User', 'URL'], rows),
      );

      const secret = this.bridge.sendSecret(context.message.event.sender, message);
      const reply = context.reply('I\'ve sent you a message with your webhook details.');
      await Promise.all([secret, reply]);
    } else {
      const rows: Text[][] = await Promise.all(hooks.map(async (h) => {
        const profile = await this.bridge.getProfileInfo(h.user_id);
        return [`#${h.id}`, fmt(user(profile)), code(`${this.config.webhooks.public_url}${h.path.substring(0, 10)}...`)];
      }));

      const message = fmt(
        'The following webhooks are active in ', roomDescription, '\n',
        table(['Hook', 'User', 'URL'], rows),
        '\nFor more details, try ',
        code('-hook list full [<room_id>]'),
      );

      await context.reply(message);
    }
  }

  private async setWebhookProperty(command: SetWebhookPropertyCommand, context: Command) {
    const webhook = await this.webhookRepository.getById(command.webhook_id);
    if (!webhook) {
      context.reply('That webhook does not exist.');
      return;
    }
    switch (command.property) {
      case 'avatar':
        await this.bridge.setProfileDetails(webhook.user_id, undefined, {
          url: command.value,
        });
        break;
      case 'name':
        await this.bridge.setProfileDetails(webhook.user_id, command.value, undefined);
        break;
      default:
        break;
    }
  }

  public async start(): Promise<void> {
    await this.bridge.start();

    this.bridge.registerHandler(this.commandHandler);
    this.bridge.registerHandler(MatrixEventHandlers.invite(async (context) => {
      logger.debug(`${context.event.state_key} was invited to ${context.event.room_id}`);

      if (context.event.state_key === context.bridge.getBot().getUserId()) {
        logger.info(`Accepting invite to ${context.event.room_id}.`);
        try {
          await context.bridge.getIntent(context.event.state_key).join(context.event.room_id);
        } catch (error) {
          logger.error(`Unable to join ${context.event.room_id}`);
          logger.prettyError(error);
        }
      }
      return true;
    }));

    await this.webhookListener.start();
  }
}
