import MatrixEventHandler from './MatrixEventHandler';
import EventContext from './EventContext';
import MessageContext from './MessageContext';

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
