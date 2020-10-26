import { DiscordWebhook, WebhookMessage, SlackWebhook } from './formats';
import transformWebhook from './transformWebhook';

test('transforms Slack-style webhooks', () => {
  const call: SlackWebhook = {
    text: 'A new message',
  };

  const expectedOutput: WebhookMessage = {
    text: 'A new message',
    format: 'plain',
  };

  expect(transformWebhook(call)).toEqual(expectedOutput);
});

test('sets format to markdown if mrkdwn is true', () => {
  const call: SlackWebhook = {
    text: 'A new message',
    mrkdwn: true,
  };

  const expectedOutput: WebhookMessage = {
    text: 'A new message',
    format: 'markdown',
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
    format: 'plain',
    username: 'user',
    icon: {
      url: 'http://example.com',
    },
  };

  expect(transformWebhook(call)).toEqual(expectedOutput);
});
