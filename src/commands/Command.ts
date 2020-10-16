import MessageContext from '../bridge/MessageContext';

export default class Command {
  private args: string[];

  private command: string;

  private _message: MessageContext;

  private _parameters: CommandParameters = null;

  public constructor(command: string, context: MessageContext) {
    this.args = command.split(' ');
    this.command = this.args.shift()?.toLowerCase() ?? '';
    this._message = context;
  }

  public get commandParameters(): CommandParameters {
    return this._parameters;
  }

  public get message(): MessageContext {
    return this._message;
  }

  public async reply(message: string): Promise<unknown> {
    return this._message.reply(message);
  }

  public execute(): void {
    switch (this.command) {
      case 'hook':
        this.handleWebHook();
        break;
      case 'ping':
        this._message.reply('Pong!');
        break;
      default:
        this._message.reply('Unknown command.');
        break;
    }
  }

  private handleWebHook(): void {
    const replyUsage = () => {
      this._message.reply('Usage: -hook create|list|delete');
    };

    switch (this.args[0]?.toLowerCase()) {
      case 'create':
        if (this.args.length !== 2) {
          this._message.reply('Usage: -hook create <webhook_username>');
          break;
        }
        this._parameters = {
          type: 'createWebHook',
          webhook_user_id: this.args[1],
        };
        break;
      case 'list':
        if (this.args.length !== 1) {
          this._message.reply('Usage: -hook list');
          break;
        }
        this._parameters = {
          type: 'listWebHook',
        };
        break;
      case 'delete':

        if (this.args.length !== 2) {
          this._message.reply('Usage: -hook delete <hook_number>');
          break;
        }
        this._parameters = {
          type: 'deleteWebHook',
          webhook_id: parseInt(this.args[1], 10),
        };
        break;
      default:
        replyUsage();
    }
  }
}

export type CreateWebhookCommand = {
  type: 'createWebHook',
  webhook_user_id: string,
};

export type ListWebhookCommand = {
  type: 'listWebHook'
};

export type DeleteWebhookCommand = {
  type: 'deleteWebHook'
  webhook_id: number,
};

type CommandParameters =
  | CreateWebhookCommand
  | ListWebhookCommand
  | DeleteWebhookCommand
  | null;
