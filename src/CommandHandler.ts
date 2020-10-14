import Command, { CreateWebhookCommand } from './Command';
import Message from './bridge/Message';
import MessageContext from './bridge/MessageContext';
import MessageHandler from './bridge/MessageHandler';
import Observable from './util/Observable';

export default class CommandHandler extends MessageHandler {
  onCreateWebhook = new Observable<CreateWebhookCommand>();

  public constructor() {
    super();
  }

  public handleMessage(context: MessageContext): boolean {
    if (context.event.sender === context.bridge.getBot().getUserId()) {
      return true;
    }
    const message = context.event.content as unknown as Message;

    if (message.body.match(/^-[A-z]/)) {
      const result = new Command(message.body.substr(1), context).execute();
      if (result) {
        this.onCreateWebhook.notify(result);
      }
    }
    return true;
  }
}
