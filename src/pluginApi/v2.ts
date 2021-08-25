import { Logger } from 'tslog';
import MatrixBridge from '../bridge/MatrixBridge';
import { Text } from '../formatting/formatting';
import { EmojiIcon, UrlIcon } from '../webhooks/formats';

export interface WebhookMessage {
  version: '2';
  text: Text;
  username?: string;
  icon?: EmojiIcon | UrlIcon;
}

export interface WebhookContext {
  logger: Logger,
  bridge: MatrixBridge,
}

export abstract class PluginBase {
  public constructor(
    protected logger: Logger,
    protected bridge: MatrixBridge,
  ) {
  }

  abstract init(): Promise<void>;

  abstract transform(body: unknown): Promise<WebhookMessage | undefined>;
}
