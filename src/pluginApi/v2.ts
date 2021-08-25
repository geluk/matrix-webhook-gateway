import { Logger } from 'tslog';
import MatrixBridge from '../bridge/MatrixBridge';
import { Text } from '../formatting/formatting';
import { EmojiIcon, UrlIcon } from '../webhooks/formats';

export interface WebhookPlugin {
  version: '2',
  format: string,
  init?: (context: WebhookContext) => Promise<unknown>,
  transform: (body: unknown, context: WebhookContext) => Promise<WebhookMessage | undefined>,
}

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
