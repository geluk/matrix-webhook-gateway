import { is } from 'typescript-is';
import {
  AppriseJsonWebhook_1_0,
  AppriseJsonWebhook_Unknown,
  DiscordWebhook, WebhookMessage, SlackWebhook,
  Turt2liveWebhook, WebhookContent,
} from './formats';

export default function transformWebhook(
  webhook: WebhookContent,
): WebhookMessage {
  const content: WebhookMessage = {
    text: '',
    format: 'plain',
  };

  // Because these stages are processed sequentially, not all formats may be
  // handled nicely. TODO: Allow enforcing a specific format by postfixing
  // the webhook URL with that format, e.g. /hook/<id>/slack
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

  if (is<AppriseJsonWebhook_1_0>(webhook)) {
    content.format = 'html';
    content.text = `<strong>${webhook.title}</strong><br />\n${webhook.message}`;
  } else if (is<AppriseJsonWebhook_Unknown>(webhook)) {
    content.text = webhook.message;
  }

  if (is<SlackWebhook>(webhook)) {
    content.text = webhook.text;
    if (webhook.mrkdwn) {
      content.format = 'markdown';
    }
    content.username = webhook.username;
    if (webhook.icon_url) {
      content.icon = {
        url: webhook.icon_url,
      };
    } else if (webhook.icon_emoji) {
      content.icon = {
        emoji: webhook.icon_emoji,
      };
    }
  }

  return content;
}
