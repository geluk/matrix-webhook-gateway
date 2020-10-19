import { is } from 'typescript-is';
import {
  DiscordWebhook, NormalisedWebhookContent, SlackWebhook,
  Turt2liveWebhook, WebhookContent,
} from './formats';

export default function transformWebhook(webhook: WebhookContent): NormalisedWebhookContent {
  const content: NormalisedWebhookContent = {
    text: '',
    format: 'plain',
  };

  if (is<Turt2liveWebhook>(webhook)) {
    content.text = webhook.text;
    content.format = webhook.format ?? 'plain';
    content.username = webhook.displayName;
  }
  if (is<DiscordWebhook>(webhook)) {
    content.text = webhook.content;
    content.username = webhook.username;
    if (webhook.avatar_url) {
      content.icon = {
        url: webhook.avatar_url,
      };
    }
  }
  if (is<SlackWebhook>(webhook)) {
    content.text = webhook.text;
    if (webhook.mrkdwn) {
      content.format = 'markdown';
    }
    content.username = webhook.username;
    if (webhook.icon_emoji) {
      content.icon = {
        emoji: webhook.icon_emoji,
      };
    }
  }

  return content;
}
