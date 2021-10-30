import { DiscordWebhook, SlackWebhook } from './formats';
import transformWebhook from './transformWebhook';
import { renderEmoji, toPlain } from '../formatting/formatting';
import identity from '../util/functional';

test('transforms Slack-style webhooks', () => {
  const call: SlackWebhook = {
    text: 'A new message',
  };

  const output = transformWebhook(call, identity);
  const formatted = toPlain(output.text);

  expect(formatted).toBe('A new message');
});

test('transforms Discord-style webhooks', () => {
  const call: DiscordWebhook = {
    content: 'A new message',
    username: 'user',
    avatar_url: 'http://example.com',
  };

  const output = transformWebhook(call, identity);
  const formatted = toPlain(output.text);

  expect(output.icon).toEqual({ url: 'http://example.com' });
  expect(output.username).toEqual('user');
  expect(formatted).toBe('A new message');
});

test('Executes text replacement function', () => {
  const call: DiscordWebhook = {
    content: 'HE SUN:sunny:THE SUN:sunny:THE SUN:sunny:THE',
    username: 'user',
    avatar_url: 'http://example.com',
  };

  const output = transformWebhook(call, renderEmoji);
  const formatted = toPlain(output.text);

  expect(formatted).toBe('HE SUN☀️THE SUN☀️THE SUN☀️THE');
});
