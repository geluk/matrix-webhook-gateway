import { Logging as MatrixLogger } from 'matrix-appservice-bridge';
import yargs from 'yargs/yargs';

import ConfigReader from './src/configuration/ConfigReader';
import Database from './src/repositories/Database';
import logger, { configureLogger } from './src/util/logger';
import WebhookService from './src/WebhookService';
import WebhookListener from './src/webhooks/WebhookListener';
import HookCallRepository from './src/repositories/HookCallRepository';
import Matcher from './src/webhooks/Matcher';
import UploadedImageFromDatabase from './src/repositories/UploadedImageRepository';
import MatrixBridge from './src/bridge/MatrixBridge';
import WebhookRepository from './src/repositories/WebhookRepository';
import UserRepository from './src/repositories/UserRepository';
import PluginCollection from './src/webhooks/PluginCollection';

const { argv } = yargs(process.argv.slice(2))
  .version(false)
  .strict(true)
  .demandCommand(0, 0)
  .usage('$0 [options]')
  .string('c')
  .alias('c', 'config')
  .nargs('c', 1)
  .default('c', './gateway-config.yaml')
  .describe('c', 'Path to the configuration file.')
  .string('a')
  .alias('a', 'appservice-config')
  .nargs('a', 1)
  .default('a', './appservice.yaml')
  .describe('a', 'Where the generated appservice.yaml should be placed.')
  .boolean('clear-plugin-cache')
  .default('clear-plugin-cache', false)
  .describe(
    'clear-plugin-cache',
    'Clear the plugin cache before compiling plugins.',
  )
  .count('v')
  .alias('v', 'verbose')
  .describe('v', 'Log verbosity, repeat multiple times to raise.')
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
    const imageRepository = new UploadedImageFromDatabase(database);
    const userRepository = new UserRepository(database);
    const webhookRepository = new WebhookRepository(database);
    const hookCallRepository = new HookCallRepository(database);

    const bridge = new MatrixBridge(config.app_service, imageRepository, userRepository);
    const plugins = new PluginCollection(config.webhooks, bridge);
    const matcher = new Matcher(webhookRepository, plugins);
    const webhookListener = new WebhookListener(
      config.webhooks,
      matcher,
      hookCallRepository,
    );
    const whs = new WebhookService(
      bridge,
      webhookRepository,
      webhookListener.onWebhookResult,
      config,
    );
    try {
      if (argv['clear-plugin-cache']) {
        plugins.clearCache();
      }
      await whs.start();
      await webhookListener.start();
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
