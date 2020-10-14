import CommandHandler from './CommandHandler';
import MatrixBridge from './bridge/MatrixBridge';
import MatrixEventHandlers from './bridge/MatrixEventHandlers';
import logger from './util/logger';
import Database from './repositories/Database';
import WebhookRepository from './repositories/WebhookRepository';

export default class WebHookService {
  bridge: MatrixBridge;

  commandHandler = new CommandHandler();

  database: Database;

  webhookRepository: WebhookRepository;

  public constructor(bridge: MatrixBridge, database: Database) {
    this.bridge = bridge;
    this.commandHandler.onCreateWebhook.observe(async (command) => {
      const webhook = {
        path: '/hello',
        user_id: command.webhook_user_id,
      };
      await this.webhookRepository.add(webhook);
      await this.bridge.sendMessage(command.room_id, 'Your webhook has been added.');
    });
    this.database = database;
    this.webhookRepository = new WebhookRepository(this.database);
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
  }
}
