import CommandHandler from './CommandHandler';
import MatrixBridge from './bridge/MatrixBridge';
import MatrixEventHandlers from './bridge/MatrixEventHandlers';
import logger from './util/logger';
import Database from './repositories/Database';
import WebhookRepository from './repositories/WebhookRepository';
import Command, { CreateWebhookCommand, DeleteWebhookCommand, ListWebhookCommand } from './Command';
import randomString from './util/randomString';
import WebHookListener, { HookCall } from './WebHookListener';
import Configuration from './configuration/Configuration';

const HOOK_SECRET_LENGTH = 48;

export default class WebHookService {
  bridge: MatrixBridge;

  commandHandler = new CommandHandler();

  database: Database;

  webhookRepository: WebhookRepository;

  webhookListener: WebHookListener;

  config: Configuration;

  public constructor(bridge: MatrixBridge, database: Database, config: Configuration) {
    this.bridge = bridge;
    this.commandHandler.onCommand.observe(this.handleCommand.bind(this));
    this.database = database;
    this.webhookRepository = new WebhookRepository(this.database);
    this.webhookListener = new WebHookListener(this.webhookRepository);
    this.webhookListener.onHookCalled.observe(this.handleHookCall.bind(this));
    this.config = config;
  }

  private async handleCommand(command: Command) {
    switch (command.commandParameters?.type) {
      case 'createWebHook':
        this.createWebHook(command.commandParameters, command);
        break;
      case 'listWebHook':
        this.listWebHook(command.commandParameters, command);
        break;
      case 'deleteWebHook':
        this.deleteWebHook(command.commandParameters, command);
        break;
      default:
        break;
    }
  }

  private async handleHookCall(call: HookCall) {
    this.bridge.sendMessage(call.webhook.room_id, call.content.text);
  }

  private async createWebHook(command: CreateWebhookCommand, context: Command) {
    const webhook = {
      id: undefined,
      path: `/hook/${randomString(HOOK_SECRET_LENGTH)}`,
      user_id: command.webhook_user_id,
      room_id: context.message.event.room_id,
    };
    await this.webhookRepository.add(webhook);
    context.message.bridge.getIntent(webhook.user_id).join(webhook.room_id);
    logger.info(context.message.message.msgtype);
    context.reply(webhook.path);
  }

  private async deleteWebHook(command: DeleteWebhookCommand, context: Command) {
    const removed = await this.webhookRepository
      .deleteFromRoom(command.webhook_id, context.message.event.room_id);
    if (removed) {
      context.reply('Webhook removed.');
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

  public start(): void {
    this.bridge.start();

    this.bridge.registerHandler(this.commandHandler);

    this.bridge.registerHandler(MatrixEventHandlers.invite((context) => {
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
