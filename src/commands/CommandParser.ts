import MessageContext from '../bridge/MessageContext';

export default class CommandParser {
  private args: string[];

  private command: string;

  private message: MessageContext;

  public constructor(command: string, context: MessageContext) {
    this.args = command.split(' ');
    this.command = this.args.shift()?.toLowerCase() ?? '';
    this.message = context;
  }

  public async parse(): Promise<Command | undefined> {
    switch (this.command) {
      case 'help':
        await this.message.reply('Valid commands: help|hook|ping');
        return undefined;
      case 'hook':
        return this.handleWebhook();
      case 'ping':
        this.message.reply('Pong!');
        return undefined;
      default:
        this.message.reply('Unknown command.');
        return undefined;
    }
  }

  private async handleWebhook(): Promise<Command | undefined> {
    const replyUsage = async () => {
      await this.message.reply('Usage: -hook create|list|delete');
      return undefined;
    };

    switch (this.args[0]?.toLowerCase()) {
      case 'create':
        if (this.args.length !== 2) {
          await this.message.reply('Usage: -hook create <webhook_username>');
          return undefined;
        }
        return this.createCommand({
          type: 'createWebhook',
          webhook_user_id: this.args[1],
        });
      case 'list':
        if (this.args.length !== 1) {
          await this.message.reply('Usage: -hook list');
          return undefined;
        }
        return this.createCommand({
          type: 'listWebhook',
        });
      case 'delete':
        if (this.args.length !== 2 || Number.isNaN(parseInt(this.args[1], 10))) {
          await this.message.reply('Usage: -hook delete <hook_number>');
          return undefined;
        }
        return this.createCommand({
          type: 'deleteWebhook',
          webhook_id: parseInt(this.args[1], 10),
        });
      default:
        return replyUsage();
    }
  }

  private createCommand(params: CommandParameters): Command {
    return {
      parameters: params,
      message: this.message,
      reply: this.message.reply.bind(this.message),
    };
  }
}

export type Command = {
  parameters: CommandParameters,
  message: MessageContext,
  reply: (message: string) => Promise<unknown>,
};

export type CreateWebhookCommand = {
  type: 'createWebhook',
  webhook_user_id: string,
};

export type ListWebhookCommand = {
  type: 'listWebhook'
};

export type DeleteWebhookCommand = {
  type: 'deleteWebhook'
  webhook_id: number,
};

type CommandParameters =
  | CreateWebhookCommand
  | ListWebhookCommand
  | DeleteWebhookCommand;
