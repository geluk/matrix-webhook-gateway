import MessageContext from './MessageContext';

export default class Command {
  private args: string[];

  private command: string;

  context: MessageContext;

  public constructor(command: string, context: MessageContext) {
    this.args = command.split(' ');
    this.command = this.args.shift()!.toLowerCase();
    this.context = context;
  }

  public execute(): void {
    switch (this.command) {
      case 'webhook':
        this.context.reply('Creating webhook.');
        break;
      case 'ping':
        this.context.reply('Pong!');
        break;
      default:
        this.context.reply('Unknown command.');
        break;
    }
  }
}
