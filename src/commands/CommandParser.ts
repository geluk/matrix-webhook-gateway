import MessageContext from '../bridge/MessageContext';
import {
  br, code, Text,
} from '../formatting/formatting';

export default class CommandParser {
  private args: string[];

  private command: string;

  private message: MessageContext;

  public constructor(command: string, context: MessageContext) {
    this.args = command.trimEnd().split(' ');
    this.command = this.args.shift()?.toLowerCase() ?? '';
    this.message = context;
  }

  public async parse(): Promise<Command | undefined> {
    switch (this.command) {
      case 'help':
        await this.message.reply(
          'Try a command to learn more about its usage.', br(),
          'Valid commands: ', code('help'), ', ', code('hook'), br(),
          'Help syntax: ', code('<required argument>'), ', ', code('[<optional argument>]'),
          ', ', code('[optional command]'), ', ', code('alternative_1|alternative_2'),
        );
        return undefined;
      case 'hook':
        return this.handleWebhook();
      default:
        return undefined;
    }
  }

  private async handleWebhook(): Promise<Command | undefined> {
    const replyUsage = async () => {
      await this.message.reply(
        'Usage: ', code('-hook create|list|delete|rotate|set'),
      );
      return undefined;
    };

    switch (this.args[0]?.toLowerCase()) {
      case 'create':
        if (this.args.length !== 2) {
          await this.message.reply(
            'Usage: ', code('-hook create <webhook_username>'),
          );
          return undefined;
        }
        return this.createCommand({
          type: 'createWebhook',
          webhook_user_id: this.args[1],
        });
      case 'list':
      {
        let roomId: string | undefined;
        let full = false;
        if (this.args.length > 3) {
          await this.message.reply('Usage: ', code('-hook list [full] [<room_id>]'));
          return undefined;
        }
        if (this.args.length > 1) {
          if (this.args[1] === 'full') {
            full = true;
            if (this.args.length > 2) {
              if (this.args[2].startsWith('#')) {
                roomId = this.args[2];
              } else {
                await this.message.reply('Usage: ', code('-hook list [full] [<room_id>]'));
                return undefined;
              }
            }
          } else if (this.args[1].startsWith('#')) {
            roomId = this.args[1];
          } else {
            await this.message.reply('Usage: ', code('-hook list [full] [<room_id>]'));
            return undefined;
          }
        }

        return this.createCommand({
          type: 'listWebhook',
          full,
          roomId,
        });
      }
      case 'delete':
      {
        const hookId = this.parseNumber(1);
        if (this.args.length !== 2 || hookId === undefined) {
          await this.message.reply('Usage: ', code('-hook delete <hook_number>'));
          return undefined;
        }
        return this.createCommand({
          type: 'deleteWebhook',
          webhook_id: hookId,
        });
      }
      case 'rotate':
      {
        const hookId = this.parseNumber(1);
        if (this.args.length !== 2 || hookId === undefined) {
          await this.message.reply('Usage: ', code('-hook rotate <hook_number>'));
          return undefined;
        }
        return this.createCommand({
          type: 'rotateWebhook',
          webhookId: hookId,
        });
      }
      case 'set':
      {
        const hookId = this.parseNumber(1);
        if (
          this.args.length !== 4
          || (this.args[1] !== 'name'
          && this.args[1] !== 'avatar')
          || hookId === undefined
        ) {
          await this.message.reply(
            'Usage: ', code('-hook set name|avatar <hook_number> <name|avatar_url>'),
          );
          return undefined;
        }
        return this.createCommand({
          type: 'setWebhookProperty',
          webhook_id: hookId,
          property: this.args[1],
          value: this.args[3],
        });
      }
      default:
        return replyUsage();
    }
  }

  private parseNumber(argumentIndex: number): number | undefined {
    const cleaned = this.args[argumentIndex].replaceAll('#', '');
    const parsed = parseInt(cleaned, 10);
    if (Number.isNaN(parsed)) {
      return undefined;
    }
    return parsed;
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
  reply: (...message: Text[]) => Promise<unknown>,
};

export type CreateWebhookCommand = {
  type: 'createWebhook',
  webhook_user_id: string,
};

export type ListWebhookCommand = {
  type: 'listWebhook'
  roomId?: string,
  full: boolean,
};

export type DeleteWebhookCommand = {
  type: 'deleteWebhook'
  webhook_id: number,
};

export type RotateWebhookCommand = {
  type: 'rotateWebhook',
  webhookId: number,
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
