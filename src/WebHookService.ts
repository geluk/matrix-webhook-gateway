import CommandHandler from './commands/CommandHandler';
import MatrixBridge from './bridge/MatrixBridge';
import MatrixEventHandlers from './bridge/MatrixEventHandlers';
import logger from './util/logger';
import Database from './repositories/Database';
import WebhookRepository from './repositories/WebhookRepository';
import Command, { CreateWebhookCommand, DeleteWebhookCommand, ListWebhookCommand } from './commands/Command';
import randomString from './util/randomString';
import WebHookListener, { HookCall } from './WebHookListener';
import Configuration from './configuration/Configuration';
import { generateLocalPart } from './util/matrixUtilities';

const HOOK_SECRET_LENGTH = 48;

export default class WebHookService {
  bridge: MatrixBridge;

  commandHandler = new CommandHandler();

  database: Database;

  webhookRepository: WebhookRepository;

  webhookListener: WebHookListener;

  config: Configuration;

  public constructor(database: Database, config: Configuration) {
    this.bridge = new MatrixBridge(config.app_service);
    this.commandHandler.onCommand.observe(this.handleCommand.bind(this));
    this.database = database;
    this.webhookRepository = new WebhookRepository(this.database);
    this.webhookListener = new WebHookListener(this.webhookRepository, config.webhooks);
    this.webhookListener.onHookCalled.observe(this.handleHookCall.bind(this));
    this.config = config;
  }

  private async handleCommand(command: Command) {
    switch (command.commandParameters?.type) {
      case 'createWebHook':
        await this.createWebHook(command.commandParameters, command);
        break;
      case 'listWebHook':
        await this.listWebHook(command.commandParameters, command);
        break;
      case 'deleteWebHook':
        await this.deleteWebHook(command.commandParameters, command);
        break;
      default:
        break;
    }
  }

  private async handleHookCall(call: HookCall) {
    await this.bridge.sendMessage(call.webhook.room_id, call.content.text, call.webhook.user_id);
  }

  private async createWebHook(command: CreateWebhookCommand, context: Command) {
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
    await this.webhookRepository.add(webhook);

    context.reply(`Your webhook for ${command.webhook_user_id} in ${context.message.event.room_id} was created.\n `
      + `URL: ${this.config.webhooks.public_url}${webhook.path}`);
  }

  private async deleteWebHook(command: DeleteWebhookCommand, context: Command) {
    const removed = await this.webhookRepository
      .deleteFromRoom(command.webhook_id, context.message.event.room_id);
    if (removed) {
      context.reply('Webhook deleted.');
    } else {
      context.reply(`Webhook #${command.webhook_id} not found in this room.`);
    }
  }

  private async listWebHook(command: ListWebhookCommand, context: Command) {
    const hooks = await this.webhookRepository.findByRoom(context.message.event.room_id);
    if (hooks.length === 0) {
      context.reply('No hooks active in this room.');
      return;
    }
    const message = hooks.map((h) => `${h.id}: ${h.user_id} (${h.path.substring(0, 10)}...)`).join('\n');
    context.reply(message);
  }

  public async start(): Promise<void> {
    await this.database.assertConnection();

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
