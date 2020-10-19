import Webhook from '../models/Webhook';

export interface HookCall {
  webhook: Webhook;
  content: NormalisedWebhookContent;
}

export interface NormalisedWebhookContent {
  text: string;
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
 | Turt2liveWebhook;

export interface DiscordWebhook {
  content: string;
  username?: string;
  avatar_url?: string;
}

export interface SlackWebhook {
  text: string;
  username?: string;
  icon_emoji?: string;
  mrkdwn?: boolean;
}

export interface Turt2liveWebhook {
  text: string;
  format?: 'plain' | 'html';
  displayName?: string;
  avatarUrl?: string;
  emoji?: boolean;
}
