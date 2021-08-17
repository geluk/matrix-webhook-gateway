import { Text } from '../formatting/formatting';
import Webhook from '../models/Webhook';

export interface WebhookResult {
  webhook: Webhook;
  content: WebhookMessageV1 | WebhookMessageV2;
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

export type EmojiIcon = {
  emoji: string;
};

export type UrlIcon = {
  url: string;
};

export type WebhookContent =
 | SlackWebhook
 | DiscordWebhook
 | Turt2liveWebhook
 | AppriseJsonWebhook_1_0
 | AppriseJsonWebhook_Unknown;

export interface DiscordWebhook {
  content: string;
  username?: string;
  avatar_url?: string;
}

export interface SlackWebhook {
  text: string;
  username?: string;
  icon_emoji?: string;
  icon_url?: string;
  mrkdwn?: boolean;
}

// We can be pretty strict about parsing v1.0; its content is well defined:
// https://github.com/caronc/apprise/wiki/Notify_Custom_JSON
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface AppriseJsonWebhook_1_0 {
  version: '1.0';
  title: string;
  message: string;
  type: 'info' | 'success' | 'failure' | 'warning';
}

// If that fails, we can fall back to a best-effort match:
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface AppriseJsonWebhook_Unknown {
  version: string;
  title?: string;
  message: string;
}

export interface Turt2liveWebhook {
  text: string;
  format?: 'plain' | 'html';
  displayName?: string;
  avatarUrl?: string;
  emoji?: boolean;
}
