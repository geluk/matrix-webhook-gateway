import CommandHandler from './commands/CommandHandler';
import MatrixBridge from './bridge/MatrixBridge';
import MatrixEventHandlers from './bridge/events/MatrixEventHandlers';
import logger from './util/logger';
import Database from './repositories/Database';
import WebhookRepository from './repositories/WebhookRepository';
import {
  Command, CreateWebhookCommand, DeleteWebhookCommand, ListWebhookCommand,
} from './commands/CommandParser';
import randomString from './util/randomString';
import WebhookListener from './webhooks/WebhookListener';
import Configuration from './configuration/Configuration';
import { generateLocalPart } from './util/matrixUtilities';
import UserRepository from './repositories/UserRepository';
import { HookCall } from './webhooks/formats';
import Matcher from './webhooks/Matcher';
import UploadedImageFromDatabase from './repositories/UploadedImageRepository';

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

    this.bridge = new MatrixBridge(config.app_service, imageRepository, this.userRepository);
    this.commandHandler.onCommand.observe(this.handleCommand.bind(this));
    this.webhookListener = new WebhookListener(
      config.webhooks,
      new Matcher(this.webhookRepository, this.config.webhooks),
    );
    this.webhookListener.onHookCall.observe(this.handleHookCall.bind(this));
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
      default:
        break;
    }
  }

  private async handleHookCall(call: HookCall): Promise<void> {
    await this.bridge.setProfileDetails(
      call.webhook.user_id,
      call.content.username,
      call.content.icon,
    );
    await this.bridge.sendMessage(
      call.webhook.room_id,
      call.content.text,
      call.webhook.user_id,
      call.content.format,
    );
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

    const secret = this.bridge.sendSecret(context.message.event.sender, `Your webhook for ${command.webhook_user_id} in ${context.message.event.room_id} was created.\n `
    + `URL: ${this.config.webhooks.public_url}${webhook.path}`);

    this.bridge.sendTyping(webhook.room_id, false);
    const reply = context.reply('I\'ve sent you a message with your webhook details.');
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
      context.reply(`Webhook #${command.webhook_id} not found in this room.`);
    }
  }

  private async rotateWebhook(command: DeleteWebhookCommand, context: Command) {
    const webhook = await this.webhookRepository.getById(command.webhook_id);
    if (webhook) {
      webhook.path = `/hook/${randomString(HOOK_SECRET_LENGTH)}`;
      await this.webhookRepository.update(webhook);

    const secret = this.bridge.sendSecret(context.message.event.sender, `Your webhook for ${webhook.user_id} in ${context.message.event.room_id} was rotated.\n `
    + `URL: ${this.config.webhooks.public_url}${webhook.path}`);

    this.bridge.sendTyping(webhook.room_id, false);
    const reply = context.reply('I\'ve sent you a message with your webhook details.');
    await Promise.all([secret, reply]);

    } else {
      context.reply(`That webhook does not exist.`);
    }
  }


  private async listWebhook(command: ListWebhookCommand, context: Command) {
    const hooks = await this.webhookRepository.findByRoom(context.message.event.room_id);
    if (hooks.length === 0) {
      context.reply('No hooks active in this room.');
      return;
    }
    const message = hooks.map((h) => `${h.id}: ${h.user_id} (${h.path.substring(0, 10)}...)`).join('\n');
    context.reply(message);
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

    this.webhookListener.start();
  }
}
