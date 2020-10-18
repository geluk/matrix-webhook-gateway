import { Logger } from 'tslog';

const logger = new Logger({
  name: 'webhook-srv',
  displayFunctionName: false,
  displayFilePath: 'hidden',
  minLevel: 'trace',
});
export default logger;

type LogLevel = 'silly' | 'debug' | 'trace' | 'info' | 'warn' | 'error' | 'fatal';
function getLevel(verbosity: number): LogLevel {
  switch (verbosity) {
    case 0:
      return 'info';
    case 1:
      return 'debug';
    case 2:
      return 'trace';
    default:
      return 'silly';
  }
}

export function configureLogger(verbosity: number): void {
  logger.setSettings({
    minLevel: getLevel(verbosity),
    // This is a bit of a hack, but we need to enable it to prevent matrix-js-sdk
    // from logging event details directly to the console. It may be possible to
    // attach your own logger to it though; in that case this can be disabled.
    // See: https://github.com/matrix-org/matrix-js-sdk/blob/develop/src/logger.js
    // Should only be done after yargs has finished parsing arguments, because it
    // wants to write its feedback to the console.
    overwriteConsole: true,
  });
}

const bridgeLog = logger.getChildLogger({
  name: 'bridge',
});
export function forwardMatrixLog(text: string, isError: boolean): void {
  if (isError) {
    bridgeLog.warn(text);
  } else {
    bridgeLog.silly(text);
  }
}
