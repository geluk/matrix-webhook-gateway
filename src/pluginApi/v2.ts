import type { ILogObj, Logger } from 'tslog';
import MatrixBridge from '../bridge/MatrixBridge';
import { Text } from '../formatting/formatting';
import { EmojiIcon, UrlIcon } from '../webhooks/formats';

export interface WebhookMessage {
  text: Text;
  username?: string;
  icon?: EmojiIcon | UrlIcon;
}

export interface WebhookContext {
  logger: Logger<ILogObj>;
  bridge: MatrixBridge;
}

export abstract class PluginBase {
  public constructor(
    protected logger: Logger<ILogObj>,
    protected bridge: MatrixBridge,
  ) {}

  abstract init(): Promise<void>;

  abstract transform(body: unknown): Promise<WebhookMessage | undefined>;
}
