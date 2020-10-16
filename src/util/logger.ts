import { Logger } from 'tslog';

const logger = new Logger({
  name: 'webhook-srv',
  displayFunctionName: false,
  displayFilePath: 'hidden',
  minLevel: 'trace',
  // This is a bit of a hack, but we need to enable it to prevent matrix-js-sdk
  // from logging event details directly to the console. It may be possible to
  // attach your own logger to it though; in that case this can be disabled.
  // See: https://github.com/matrix-org/matrix-js-sdk/blob/develop/src/logger.js
  overwriteConsole: true,
});
export default logger;
