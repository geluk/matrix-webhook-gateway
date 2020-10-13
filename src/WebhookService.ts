import { CommandHandler } from './CommandHandler';
import MatrixBridge from './MatrixBridge';
import { MatrixEventHandlers } from './MatrixEventHandler';

export default class WebhookService {
  bridge: MatrixBridge;

  commandHandler = new CommandHandler();

  public constructor(bridge: MatrixBridge) {
    this.bridge = bridge;
  }

  public start() {
    this.bridge.start();

    this.bridge.registerHandler(this.commandHandler);

    this.bridge.registerHandler(MatrixEventHandlers.invite((context) => {
      console.log(`${context.event.state_key} was invited to ${context.event.room_id}`);

      if (context.event.state_key === context.bridge.getBot().getUserId()) {
        console.log('Accepting invite.');
        context.bridge.getIntent(context.event.state_key).join(context.event.room_id);
      }
    }));
  }
}
