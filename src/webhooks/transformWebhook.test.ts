import { DiscordWebhook, SlackWebhook } from './formats';
import { WebhookMessage } from '../pluginApi/v2';
import transformWebhook from './transformWebhook';

test('transforms Slack-style webhooks', () => {
  const call: SlackWebhook = {
    text: 'A new message',
  };

  const expectedOutput: WebhookMessage = {
    text: 'A new message',
  };

  expect(transformWebhook(call)).toEqual(expectedOutput);
});

test('transforms Discord-style webhooks', () => {
  const call: DiscordWebhook = {
    content: 'A new message',
    username: 'user',
    avatar_url: 'http://example.com',
  };

  const expectedOutput: WebhookMessage = {
    text: 'A new message',
    username: 'user',
    icon: {
      url: 'http://example.com',
    },
  };

  expect(transformWebhook(call)).toEqual(expectedOutput);
});
