import CommandParser, { Command } from './CommandParser';
import MessageContent from '../bridge/MessageContent';
import MessageContext from '../bridge/MessageContext';
import MessageHandler from '../bridge/events/MessageHandler';
import Observable from '../util/Observable';

const COMMAND_MATCH = /^-[A-z]/;

export default class CommandHandler extends MessageHandler {
  onCommand = new Observable<Command>();

  public constructor() {
    super();
  }

  public async handleMessage(context: MessageContext): Promise<boolean> {
    if (context.event.sender === context.bridge.getBot().getUserId()) {
      return true;
    }
    const message = context.event.content as unknown as MessageContent;

    if (message.body.match(COMMAND_MATCH)) {
      const parser = new CommandParser(message.body.substr(1), context);

      const invocation = await parser.parse();
      if (invocation) {
        await this.onCommand.notify(invocation);
      }
    }
    return true;
  }
}
