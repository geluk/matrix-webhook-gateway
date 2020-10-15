import { Logging as MatrixLogger } from 'matrix-appservice-bridge';

import MatrixBridge from './src/bridge/MatrixBridge';
import ConfigReader from './src/configuration/ConfigReader';
import Database from './src/repositories/Database';
import logger from './src/util/logger';
import WebHookService from './src/WebHookService';

MatrixLogger.default.configure({
  console: 'error',
  maxFiles: 1,
});

const config = ConfigReader.readConfig('webhook-appservice.yaml');
if (typeof config === 'undefined') {
  logger.fatal('Could not load configuration file, application will now exit');
  process.exit(1);
}

const whs = new WebHookService(
  new MatrixBridge(),
  new Database(),
  config,
);
whs.start();
