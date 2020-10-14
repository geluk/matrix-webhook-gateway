import Command from './Command';
import Message from './Message';
import MessageContext from './MessageContext';
import MessageHandler from './MessageHandler';

export default class CommandHandler extends MessageHandler {
  public constructor() {
    super();
  }

  public handleMessage(context: MessageContext): boolean {
    if (context.event.sender === context.bridge.getBot().getUserId()) {
      return true;
    }
    const message = context.event.content as unknown as Message;

    if (message.body.match(/^-[A-z]/)) {
      new Command(message.body.substr(1), context).execute();
    }
    return true;
  }
}
