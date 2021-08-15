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
        await this.message.reply('Valid commands: help|hook');
        return undefined;
      case 'hook':
        return this.handleWebhook();
      default:
        return undefined;
    }
  }

  private async handleWebhook(): Promise<Command | undefined> {
    const replyUsage = async () => {
      await this.message.reply('Usage: -hook create|list|delete|rotate|set');
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
      {
        let full = false;
        if (this.args.length === 2) {
          if (this.args[1] === 'full') {
            full = true;
          } else {
            await this.message.reply('Usage: -hook list [full]');
            return undefined;
          }
        }
        if (this.args.length > 2) {
          await this.message.reply('Usage: -hook list [full]');
          return undefined;
        }
        return this.createCommand({
          type: 'listWebhook',
          full,
        });
      }
      case 'delete':
        if (this.args.length !== 2 || !this.validateNumber(1)) {
          await this.message.reply('Usage: -hook delete <hook_number>');
          return undefined;
        }
        return this.createCommand({
          type: 'deleteWebhook',
          webhook_id: parseInt(this.args[1], 10),
        });
      case 'rotate':
        if (this.args.length !== 2 || !this.validateNumber(1)) {
          await this.message.reply('Usage: -hook rotate <hook_number>');
          return undefined;
        }
        return this.createCommand({
          type: 'rotateWebhook',
          webhook_id: parseInt(this.args[1], 10),
        });
      case 'set':
        if (
          this.args.length !== 4
          || (this.args[1] !== 'name'
          && this.args[1] !== 'avatar')
          || !this.validateNumber(2)
        ) {
          await this.message.reply('Usage: -hook set name|avatar <hook_number> <name|avatar_url>');
          return undefined;
        }
        return this.createCommand({
          type: 'setWebhookProperty',
          webhook_id: parseInt(this.args[2], 10),
          property: this.args[1],
          value: this.args[3],
        });
      default:
        return replyUsage();
    }
  }

  private validateNumber(argumentIndex: number): boolean {
    return !Number.isNaN(parseInt(this.args[argumentIndex], 10));
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
  full: boolean,
};

export type DeleteWebhookCommand = {
  type: 'deleteWebhook'
  webhook_id: number,
};

export type RotateWebhookCommand = {
  type: 'rotateWebhook',
  webhook_id: number,
};

export type SetWebhookPropertyCommand = {
  type: 'setWebhookProperty',
  webhook_id: number,
  property: 'name' | 'avatar',
  value: string,
};

type CommandParameters =
  | CreateWebhookCommand
  | ListWebhookCommand
  | DeleteWebhookCommand
  | RotateWebhookCommand
  | SetWebhookPropertyCommand;
