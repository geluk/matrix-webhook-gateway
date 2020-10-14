import CommandHandler from './CommandHandler';
import MatrixBridge from './MatrixBridge';
import MatrixEventHandlers from './MatrixEventHandlers';
import logger from './util/logger';

export default class WebhookService {
  bridge: MatrixBridge;

  commandHandler = new CommandHandler();

  public constructor(bridge: MatrixBridge) {
    this.bridge = bridge;
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
