import { is } from 'typescript-is';
import { br, fmt, strong } from '../formatting/formatting';
import logger from '../util/logger';
import {
  AppriseJsonWebhook_1_0,
  AppriseJsonWebhook_Unknown,
  DiscordWebhook, SlackWebhook,
  Turt2liveWebhook, WebhookContent,
} from './formats';
import { WebhookMessage } from '../pluginApi/v2';

export default function transformWebhook(
  webhook: WebhookContent,
): WebhookMessage {
  const content: WebhookMessage = {
    version: '2',
    text: '',
  };

  // Because these stages are processed sequentially, not all formats may be
  // handled nicely. TODO: Allow enforcing a specific format by postfixing
  // the webhook URL with that format, e.g. /hook/<id>/slack
  if (is<Turt2liveWebhook>(webhook)) {
    content.text = webhook.text;
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
    content.text = fmt(strong(`${webhook.title}`), br(), webhook.message);
  } else if (is<AppriseJsonWebhook_Unknown>(webhook)) {
    content.text = webhook.message;
  }

  if (is<SlackWebhook>(webhook)) {
    content.text = webhook.text;
    if (webhook.mrkdwn) {
      logger.debug('Received a markdown-formatted webhook, but markdown is not supported.');
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
