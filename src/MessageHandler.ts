import MatrixEventHandler from './MatrixEventHandler';
import MessageContext, { EventContext } from './MessageContext';

export default abstract class MessageHandler implements MatrixEventHandler {
  abstract handleMessage(context: MessageContext): boolean;

  handleEvent(context: EventContext): boolean {
    if (context.event.type === 'm.room.message') {
      const message = new MessageContext(context.event, context.bridge);
      return this.handleMessage(message);
    }
    return false;
  }
}
