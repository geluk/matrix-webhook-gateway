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

    this.bridge = new MatrixBridge(config.app_service, this.userRepository);
    this.commandHandler.onCommand.observe(this.handleCommand.bind(this));
    this.webhookListener = new WebhookListener(this.webhookRepository, config.webhooks);
    this.webhookListener.onHookCalled.observe(this.handleHookCall.bind(this));
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
      default:
        break;
    }
  }

  private async handleHookCall(call: HookCall): Promise<void> {
    await this.bridge.sendMessage(call.webhook.room_id, call.content.text, call.webhook.user_id);
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
      id: undefined,
      path: `/hook/${randomString(HOOK_SECRET_LENGTH)}`,
      user_id: userId,
      room_id: context.message.event.room_id,
    };
    logger.silly('Webhook:', webhook);

    if (!await this.bridge.tryJoinRoom(webhook.user_id, webhook.room_id)) {
      logger.debug(`${webhook.user_id} was unable to join ${webhook.room_id}`);
      context.reply('I am unable to invite a webhook user to this room.\n'
        + 'Please make sure I am allowed to invite users, then try again.');
      return;
    }

    await this.webhookRepository.add(webhook);
    logger.debug('Webhook created successfully');

    await this.bridge.sendSecret(context.message.event.sender, `Your webhook for ${command.webhook_user_id} in ${context.message.event.room_id} was created.\n `
    + `URL: ${this.config.webhooks.public_url}${webhook.path}`);

    await context.reply('I\'ve sent you a message with your webhook details.');
  }

  private async deleteWebhook(command: DeleteWebhookCommand, context: Command) {
    const webhook = await this.webhookRepository.getById(command.webhook_id);
    if (webhook) {
      const allHooks = await this.webhookRepository.findByRoom(webhook.room_id, webhook.user_id);
      if (allHooks.length === 1) {
        logger.debug(`Last webhook for ${webhook.user_id} in ${webhook.room_id} deleted, leaving.`);
        await this.bridge.leaveRoom(webhook.user_id, webhook.room_id);
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
    this.bridge.start();

    this.bridge.registerHandler(this.commandHandler);
    this.bridge.registerHandler(MatrixEventHandlers.invite(async (context) => {
      logger.debug(`${context.event.state_key} was invited to ${context.event.room_id}`);

      if (context.event.state_key === context.bridge.getBot().getUserId()) {
        logger.info(`Accepting invite to ${context.event.room_id}.`);
        context.bridge.getIntent(context.event.state_key).join(context.event.room_id);
      }
      return true;
    }));

    this.webhookListener.start();
  }
}
