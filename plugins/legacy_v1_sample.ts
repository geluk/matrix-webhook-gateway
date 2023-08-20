import { is } from 'typia';
import * as v1 from '../../src/pluginApi/v1'

// This is a sample plugin for the (legacy) v1 plugin API.
// It is used to test backwards compatibility with older plugins.
// Do not use this file as a reference when developing new plugins,
// use the develop/sample.ts example instead.
const plugin: v1.WebhookPlugin = {
  format: 'legacy_v1',
  version: '1',
  init() {
  },
  transform(body: unknown): v1.WebhookMessage | undefined {
    if (!is<{
      message: string,
      recipient: string,
    }>(body)) {
      return undefined;
    }
    return {
      text: `Hello, ${body.recipient}! You have a new message: ${body.message}`,
      format: 'plain',
    };
  },
};

export default plugin;
