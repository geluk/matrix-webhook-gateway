import { DiscordWebhook, WebhookMessageV2, SlackWebhook } from './formats';
import transformWebhook from './transformWebhook';

test('transforms Slack-style webhooks', () => {
  const call: SlackWebhook = {
    text: 'A new message',
  };

  const expectedOutput: WebhookMessageV2 = {
    version: '2',
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

  const expectedOutput: WebhookMessageV2 = {
    version: '2',
    text: 'A new message',
    username: 'user',
    icon: {
      url: 'http://example.com',
    },
  };

  expect(transformWebhook(call)).toEqual(expectedOutput);
});
