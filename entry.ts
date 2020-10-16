import { Logging as MatrixLogger } from 'matrix-appservice-bridge';

import ConfigReader from './src/configuration/ConfigReader';
import Database from './src/repositories/Database';
import logger from './src/util/logger';
import WebHookService from './src/WebHookService';

MatrixLogger.default.configure({
  console: 'error',
  maxFiles: 1,
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled error:', (error as Error).message);
  logger.prettyError(error as Error);
  logger.fatal('Unhandled promise rejection, application will now exit');
  process.exit(1);
});

const config = ConfigReader.loadConfig('webhook-appservice.yaml');
if (typeof config === 'undefined') {
  logger.fatal('Could not load configuration file, application will now exit');
  process.exit(1);
}

const whs = new WebHookService(
  new Database(),
  config,
);
whs.start();
