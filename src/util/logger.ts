import type { Knex } from 'knex';
import { DefaultLogLevels, Logger } from 'tslog';
import type { ILogObj } from 'tslog';

const logger: Logger<ILogObj> = new Logger({
  name: 'webhook-srv',
  type: 'pretty',
  minLevel: 'TRACE',
});
export default logger;

function getLevel(verbosity: number): DefaultLogLevels {
  switch (verbosity) {
    case 0:
      return DefaultLogLevels.INFO;
    case 1:
      return DefaultLogLevels.DEBUG;
    case 2:
      return DefaultLogLevels.TRACE;
    default:
      return DefaultLogLevels.SILLY;
  }
}

const bridgeLog = logger.getSubLogger({
  name: 'bridge',
});

const knexLog = logger.getSubLogger({
  name: 'knex',
});

export function configureLogger(verbosity: number): void {
  const level = getLevel(verbosity);
  // Sub-loggers copy their settings, so update each one explicitly.
  logger.settings.minLevel = level;
  bridgeLog.settings.minLevel = level;
  knexLog.settings.minLevel = level;
}

export function forwardMatrixLog(text: string, isError: boolean): void {
  if (isError) {
    bridgeLog.warn(text);
  } else {
    bridgeLog.silly(text);
  }
}

export function getKnexLogger(): Knex.Logger {
  return {
    warn: (msg: string) => knexLog.warn(msg),
    error: (msg: string) => knexLog.error(msg),
    debug: (msg: string) => knexLog.silly(msg),
    inspectionDepth: 10,
    enableColors: true,
  };
}

export const logExt = {
  prettyError(error: unknown): void {
    if (error instanceof Error) {
      logger.error(error);
    } else {
      logger.error(String(error));
    }
  },
  tryLogMessage(error: unknown): void {
    if (error instanceof Error) {
      logger.error(error.message);
    } else {
      logger.error(String(error));
    }
  },
};
