import MessageContext from './bridge/MessageContext';

export default class Command {
  private args: string[];

  private command: string;

  context: MessageContext;

  public constructor(command: string, context: MessageContext) {
    this.args = command.split(' ');
    this.command = this.args.shift()!.toLowerCase();
    this.context = context;
  }

  public execute(): ExecuteResult {
    switch (this.command) {
      case 'webhook':
        return this.createWebhook();
      case 'ping':
        this.context.reply('Pong!');
        break;
      default:
        this.context.reply('Unknown command.');
    }
    return null;
  }

  private createWebhook(): ExecuteResult {
    if (this.args.length !== 1) {
      this.context.reply('Usage: -webhook [username]');
      return null;
    }
    return {
      room_id: this.context.event.room_id,
      webhook_user_id: this.args[0],
    };
  }
}

export type CreateWebhookCommand = {
  room_id: string,
  webhook_user_id: string,
};

type ExecuteResult =
  | CreateWebhookCommand
  | null;
