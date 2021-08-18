import { Logger } from 'tslog';
import MatrixBridge from '../bridge/MatrixBridge';
import { Text } from '../formatting/formatting';
import Webhook from '../models/Webhook';
import { EmojiIcon, UrlIcon } from './formats';

export interface WebhookPluginV1 {
  version: '1',
  format: string,
  init?: () => unknown,
  transform: (body: unknown) => WebhookMessageV1 | undefined,
}

export interface WebhookPluginV2 {
  version: '2',
  format: string,
  init?: (context: WebhookContextV2) => Promise<unknown>,
  transform: (body: unknown, context: WebhookContextV2) => Promise<WebhookMessageV2 | undefined>,
}

export interface WebhookMessageV2 {
  version: '2';
  text: Text;
  username?: string;
  icon?: EmojiIcon | UrlIcon;
}

export interface WebhookMessageV1 {
  text: Text;
  username?: string;
  icon?: EmojiIcon | UrlIcon;
  format: 'plain' | 'html' | 'markdown';
}

export interface WebhookContextV2 {
  logger: Logger,
  bridge: MatrixBridge,
}

export interface WebhookResult {
  webhook: Webhook;
  content: WebhookMessageV1 | WebhookMessageV2;
}
