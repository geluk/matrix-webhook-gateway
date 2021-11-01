import { is } from 'typescript-is';
import { PluginBase, WebhookMessage } from '../../src/pluginApi/v2';
import * as f from '../../src/formatting/formatting';

// This interface specifies the format the webhook POST body should adhere to.
interface SampleContent {
  message: string;
  recipient: string;
}
// Example #1
// Given the above interface, the following JSON body will match:
// { "message": "Hello there!", "recipient": "webhook user" }

// Example #2
// The following does not match, because the 'recipient' field is missing:
// { "message": "We're out of milk", "sender": "Fridge" }

// Example #3
// Having extra fields is fine (they're simply ignored) so this also matches:
// { "recipient": "webhook user", "sender": "someone", "message": "a message" }

// This is the name of the plugin. You should add this name at the end of a
// webhook URL in order to execute the plugin. For instance, like so:
// https://webhook.example.com/hook/kou9se5kiequa9auh0ah/sample
export const format = 'sample';

// This class represents your plugin. You can give it any name you like,
// but you must keep the `export default`, or it will not be loaded.
export default class SamplePlugin extends PluginBase {
  // This function will be executed once, when the application starts.
  // You can run any plugin initialisation code here.
  async init(): Promise<void> {
    this.logger.info('Sample plugin starting up');
  }

  // This function will be executed every time a webhook with a matching
  // format is posted. It should either return a `WebhookMessage`, if the
  // webhook is to be executed, or `undefined`, if the webhook is to be
  // rejected. The `body` field will contain the deserialized JSON content
  // of the request.
  async transform(body: unknown): Promise<WebhookMessage | undefined> {
    // You can make use of 'typescript-is' to perform runtime type checks on
    // input data. This makes it easy to reject invalid webhooks.
    // In this case, we'll check if the body matches the `SampleContent`
    // interface that we've defined above.
    if (!is<SampleContent>(body)) {
      // If the content does not match (for instance, as in example #2 above),
      // log a warning.
      this.logger.warn('Invalid webhook');
      // Returning `undefined` here signals that the webhook should not result
      // in a Matrix message.
      return undefined;
    }

    // We haven now guaranteed that the `body` variable contains all the fields
    // specified in the `SamplePlugin` interface. Now we can build a message
    // to post to Matrix.
    return {
      // The display name of the webhook user. If the user does not already have
      // this display name, it will be changed.
      username: 'SamplePlugin',

      // You can also specify an avatar for the webhook user. Uncomment the
      // code below, and set a URL to the image to be used.
      // icon: {
      //   url: 'https://example.com/url/to/image.png'
      // },

      // A formatting API is available to aid in common formatting tasks.
      // Text formatted using this API will choose a sensible representation
      // for both the plaintext and HTML representations of a message, so your
      // message will also look nice on clients that don't support HTML content.
      // Documentation will be provided in the future, but for now, take a look
      // at the [source code](../src/formatting/formatting.ts) for an overview
      // of available functions.
      text: f.fmt(
        'Hello, ',
        f.strong(body.recipient),
        '! You have a new message: ',
        f.br(),
        f.blockquote(body.message),
      ),

      // If you don't need any special formatting, you can just use a string:
      // text: 'hello from the sample plugin!',
    };
  }
}
