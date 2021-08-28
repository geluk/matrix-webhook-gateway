import { is } from 'typescript-is';
import { PluginBase, WebhookMessage } from '../../src/pluginApi/v2';
import * as f from '../../src/formatting/formatting';

type SampleContent = {
  message: string;
  recipient: string;
};

export const format = 'sample';

export default class SamplePlugin extends PluginBase {
  // This function will be executed once, on startup.
  async init(): Promise<void> {
    this.logger.info('Sample plugin starting up');
  }

  // This function will be executed every time a webhook with a matching
  // format is posted. It should either return a `WebhookMessage`, if the
  // webhook is to be executed, or `undefined`, if the webhook is to be
  // rejected.
  async transform(body: unknown): Promise<WebhookMessage | undefined> {
    // You can make use of 'typescript-is' to perform runtime type checks on
    // input data. This makes it easy to reject invalid webhooks.
    if (!is<SampleContent>(body)) {
      this.logger.warn('Invalid webhook');
      return undefined;
    }
    // `body` is now guaranteed to be of the type `SampleContent`, so we can
    // safely interpolate its properties into the webhook message.
    return {
      username: 'SamplePlugin',
      text: f.fmt(
        'Hello, ',
        f.strong(body.recipient),
        '! You have a new message: ',
        f.blockquote(body.message),
      ),
    };
  }
}
