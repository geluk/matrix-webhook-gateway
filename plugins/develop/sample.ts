import { is } from 'typescript-is';
import {
  blockquote, fmt, strong,
} from '../../src/formatting/formatting';
import { WebhookContextV2, WebhookMessageV2, WebhookPluginV2 } from '../../src/webhooks/pluginApi';

type SampleContent = {
  message: string,
  recipient: string,
};

const plugin: WebhookPluginV2 = {
  format: 'sample',
  version: '2',
  async init(context: WebhookContextV2) {
    // This function will be executed once, on startup.
    context.logger.info('Sample plugin starting up');
  },
  async transform(body: unknown, context: WebhookContextV2): Promise<WebhookMessageV2 | undefined> {
    // This function will be executed every time a webhook with a matching
    // format is posted. It should either return a `WebhookMessage`, if the
    // webhook is to be executed, or `undefined`, if the webhook is to be
    // rejected.

    // You can make use of 'typescript-is' to perform runtime type checks on
    // input data. This makes it easy to reject invalid webhooks.
    if (!is<SampleContent>(body)) {
      context.logger.warn('Invalid webhook');
      return undefined;
    }
    // `body` is now guaranteed to be of the type `SampleContent`, so we can
    // safely interpolate its properties into the webhook message.
    return {
      version: '2',
      text: fmt(
        'Hello, ',
        strong(body.recipient),
        '! You have a new message: ',
        blockquote(body.message),
      ),
    };
  },
};

export default plugin;
