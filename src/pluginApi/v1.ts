import { EmojiIcon, UrlIcon } from '../webhooks/formats';
import { Text } from '../formatting/formatting';

export interface WebhookMessage {
  text: Text;
  username?: string;
  icon?: EmojiIcon | UrlIcon;
  format: 'plain' | 'html' | 'markdown';
}

export interface WebhookPlugin {
  format: string;
  init?: () => unknown;
  transform: (body: unknown) => WebhookMessage | undefined;
}
