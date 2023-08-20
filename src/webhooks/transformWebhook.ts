import { is } from 'typia';
import * as HTMLParser from 'node-html-parser';
import { br, fmt, strong, Text } from '../formatting/formatting';
import logger from '../util/logger';
import {
  AppriseJsonWebhook_1_0,
  AppriseJsonWebhook_Unknown,
  DiscordWebhook,
  SlackWebhook,
  Turt2liveWebhook,
  WebhookContent,
} from './formats';
import { WebhookMessage } from '../pluginApi/v2';

export default function transformWebhook(
  webhook: WebhookContent,
  textTransform: (text: string) => Text,
): WebhookMessage {
  const content: WebhookMessage = {
    text: '',
  };

  // Because these stages are processed sequentially, not all formats may be
  // handled nicely. TODO: Allow enforcing a specific format by postfixing
  // the webhook URL with that format, e.g. /hook/<id>/slack
  if (is<Turt2liveWebhook>(webhook)) {
    logger.silly('Matched turt2live webhook format.');
    if (webhook.format === 'html') {
      content.text = {
        formatHtml: () => webhook.text,
        // We could try to transform HTML tags to ASCII pseudo-formatting here.
        // For now, we'll just strip the HTML tags.
        formatPlain: () => HTMLParser.parse(webhook.text).text,
      };
    } else {
      content.text = textTransform(webhook.text);
    }
    content.username = webhook.displayName;
  } else if (is<DiscordWebhook>(webhook)) {
    logger.silly('Matched Discord webhook format.');
    content.text = textTransform(webhook.content);
    content.username = webhook.username;
    if (webhook.avatar_url) {
      content.icon = {
        url: webhook.avatar_url,
      };
    }
  } else if (is<AppriseJsonWebhook_1_0>(webhook)) {
    logger.silly('Matched Apprise JSON version 1.0 webhook format.');
    content.text = fmt(
      strong(textTransform(webhook.title)),
      br(),
      textTransform(webhook.message),
    );
  } else if (is<AppriseJsonWebhook_Unknown>(webhook)) {
    logger.silly('Matched Apprise JSON unknown version webhook format.');
    content.text = textTransform(webhook.message);
  } else if (is<SlackWebhook>(webhook)) {
    logger.silly('Matched Slack webhook format.');
    content.text = textTransform(webhook.text);
    if (webhook.mrkdwn) {
      logger.debug(
        'Received a markdown-formatted webhook, but markdown is not supported.',
      );
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
