import { Logging as MatrixLogger } from 'matrix-appservice-bridge';

import ConfigReader from './src/configuration/ConfigReader';
import Database from './src/repositories/Database';
import logger, { configureLogger } from './src/util/logger';
import WebhookService from './src/WebhookService';

// eslint-disable-next-line import/order
import yargs = require('yargs/yargs');

const { argv } = yargs(process.argv.slice(2))
  .version(false)
  .strict(true)
  .usage('$0 [options]')
  .string('c')
  .alias('c', 'config')
  .nargs('c', 1)
  .default('c', './gateway-config.yaml')
  .describe('c', 'Path to the configuration file')
  .string('a')
  .alias('a', 'appservice-config')
  .nargs('a', 1)
  .default('a', './appservice.yaml')
  .describe('a', 'Where the generated appservice.yaml should be placed')
  .count('v')
  .alias('v', 'verbose')
  .describe('v', 'Log verbosity, repeat multiple times to raise')
  .help('h')
  .alias('h', 'help');

configureLogger(argv.verbose);

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

const config = ConfigReader.loadConfig(argv.c, argv.a);
if (typeof config === 'undefined') {
  logger.fatal('Could not load configuration file, application will now exit');
  process.exit(1);
}

const database = new Database(config.database);
database.migrate()
  .then(async () => {
    const whs = new WebhookService(
      database,
      config,
    );
    try {
      await whs.start();
    } catch (error) {
      logger.prettyError(error);
      logger.fatal('Could not start webhook-gateway');
      process.exit(1);
    }
  })
  .catch((error) => {
    logger.prettyError(error);
    logger.fatal('Could not run migrations, application will now exit');
    process.exit(1);
  });
