import CommandParser from './CommandParser';
import Message from '../bridge/Message';
import MessageContext from '../bridge/MessageContext';
import MessageHandler from '../bridge/MessageHandler';
import Observable from '../util/Observable';

const COMMAND_MATCH = /^-[A-z]/;

export default class CommandHandler extends MessageHandler {
  onCommand = new Observable<CommandParser>();

  public constructor() {
    super();
  }

  public async handleMessage(context: MessageContext): Promise<boolean> {
    if (context.event.sender === context.bridge.getBot().getUserId()) {
      return true;
    }
    const message = context.event.content as unknown as Message;

    if (message.body.match(COMMAND_MATCH)) {
      const command = new CommandParser(message.body.substr(1), context);
      command.parse();
      await this.onCommand.notify(command);
    }
    return true;
  }
}
