import { is } from 'typescript-is';

// The interface definitions below will help you write type-safe plugin code.
interface WebhookPlugin {
  format: string,
  version: '1',
  init?: () => void,
  transform: (body: unknown) => WebhookMessage | undefined,
}

interface WebhookMessage {
  text: string;
  username?: string;
  icon?: EmojiIcon | UrlIcon;
  format: 'plain' | 'html' | 'markdown';
}

type EmojiIcon = {
  emoji: string;
};

type UrlIcon = {
  url: string;
};

type SampleContent = {
  message: string,
  recipient: string,
};

const plugin: WebhookPlugin = {
  format: 'sample',
  version: '1',
  init() {
    // This function will be executed once, on startup.
  },
  transform(body: unknown): WebhookMessage | undefined {
    // This function will be executed every time a webhook with a matching
    // format is posted. It should either return a `WebhookMessage`, if the
    // webhook is to be executed, or `undefined`, if the webhook is to be
    // rejected.

    // You can make use of 'typescript-is' to perform runtime type checks on
    // input data. This makes it easy to reject invalid webhooks.
    if (!is<SampleContent>(body)) {
      return undefined;
    }
    // `body` is now guaranteed to be of the type `SampleContent`, so we can
    // safely interpolate its properties into the webhook message.
    return {
      text: `Hello, ${body.recipient}! You have a new message: ${body.message}`,
      format: 'plain',
    };
  },
};

export default plugin;
