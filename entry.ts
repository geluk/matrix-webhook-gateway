import { Logging as MatrixLogger } from 'matrix-appservice-bridge';
import yargs from 'yargs/yargs';

import ConfigReader from './src/configuration/ConfigReader';
import Database from './src/repositories/Database';
import logger, { configureLogger } from './src/util/logger';
import WebhookService from './src/WebhookService';
import WebhookListener from './src/webhooks/WebhookListener';
import HookCallRepository from './src/repositories/HookCallRepository';
import Matcher from './src/webhooks/Matcher';
import CachedImageFromDatabase from './src/repositories/CachedImageRepository';
import MatrixBridge from './src/bridge/MatrixBridge';
import WebhookRepository from './src/repositories/WebhookRepository';
import UserRepository from './src/repositories/UserRepository';
import PluginCollection from './src/webhooks/PluginCollection';
import parseBoolean from './src/util/parseBoolean';

const { argv } = yargs(process.argv.slice(2))
  .version(false)
  .strict(true)
  .demandCommand(0, 0)
  .usage('$0 [options]')
  .option('config', {
    alias: 'c',
    type: 'string',
    nargs: 1,
    describe: 'Path to the configuration file.',
    default: () => process.env.WEBHOOK_CONFIG ?? './gateway-config.yaml',
    defaultDescription: './gateway-config.yaml',
  })
  .option('appservice-config', {
    alias: 'a',
    type: 'string',
    nargs: 1,
    describe: 'Where the generated appservice.yaml should be placed.',
    default: () => process.env.WEBHOOK_APPSERVICE_CONFIG ?? './appservice.yaml',
    defaultDescription: './appservice.yaml',
  })
  .boolean('clear-plugin-cache')
  .default('clear-plugin-cache', false)
  .describe(
    'clear-plugin-cache',
    'Clear the plugin cache before compiling plugins.',
  )
  .option('migrate', {
    type: 'number',
    description: 'Apply the specified number of migrations. To migrate up, supply a '
      + 'positive number. To migrate down, supply a negative number. '
      + 'Implies --no-auto-migrate.',
    nargs: 1,
  })
  .option('migrate-status', {
    type: 'boolean',
    description: 'Print the migration status, then exit.',
  })
  .option('auto-migrate', {
    default: () => parseBoolean(process.env.WEBHOOK_AUTO_MIGRATE) ?? true,
    hidden: true,
  })
  .describe(
    'no-auto-migrate',
    'Do not perform automatic migrations. This will cause the application to '
    + 'exit with a non-zero exit code if there are pending migrations.',
  )
  .count('v')
  .alias('v', 'verbose')
  .describe('v', 'Log verbosity, repeat multiple times to raise.')
  .help('h')
  .alias('h', 'help')
  .check((a) => {
    if (a.migrate !== undefined && Number.isNaN(a.migrate)) {
      throw new Error('Invalid number of migrations supplied.');
    }
    return true;
  });

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

const config = ConfigReader.loadConfig(
  // This is a quirk in the type annotations for yargs, it incorrectly determines
  // the type of configuration keys as functions if they have a function as
  // default value generator, even though yargs has already evaluated those
  // generators for us.
  argv.config as unknown as string,
  argv['appservice-config'] as unknown as string,
);
if (typeof config === 'undefined') {
  logger.fatal('Could not load configuration file, application will now exit');
  process.exit(1);
}

const startup = async () => {
  const database = new Database(config.database);

  try {
    await database.assertConnected();
  } catch (error) {
    logger.fatal('Unable to connect to the database: ', error);
    process.exit(1);
  }

  if (argv['auto-migrate']) {
    await database.migrate();
  } else {
    const migrations = await database.getMigrationStatus();
    if (migrations.pending.length > 0) {
      logger.fatal(
        'Application failed to start: there are pending migrations, and --no-auto-migrate was specified',
      );
      process.exit(1);
    }
  }

  const imageRepository = new CachedImageFromDatabase(database);
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
  const webhookService = new WebhookService(
    bridge,
    webhookRepository,
    webhookListener.onWebhookResult,
    config,
  );
  try {
    if (argv['clear-plugin-cache']) {
      plugins.clearCache();
    }
    await webhookService.start();
    await webhookListener.start();
  } catch (error) {
    logger.prettyError(error);
    logger.fatal('Could not start webhook-gateway');
    process.exit(1);
  }
};

const migrateAndQuit = async (migrations: number) => {
  const database = new Database(config.database);
  try {
    await database.migrateBy(migrations);
  } catch (error) {
    logger.error(error.message);
    logger.fatal('Encountered an error performing migrations, application will now exit');
    process.exit(1);
  }
  logger.info('Migration successful, application will now exit');
  process.exit(0);
};

const printMigrationStatus = async () => {
  const database = new Database(config.database);
  const migrations = await database.getMigrationStatus();
  if (migrations.completed.length === 1) {
    logger.info('There is one completed migration');
  } else {
    logger.info(`There are ${migrations.completed.length} completed migrations`);
  }
  for (const migration of migrations.completed) {
    logger.info(` - ${migration}`);
  }

  if (migrations.pending.length === 1) {
    logger.info('There is one pending migration');
  } else {
    logger.info(`There are ${migrations.pending.length} pending migrations`);
  }
  for (const migration of migrations.pending) {
    logger.info(` - ${migration.file}`);
  }
  process.exit(1);
};

const entry = async () => {
  if (argv['migrate-status']) {
    await printMigrationStatus();
  } else if (argv.migrate) {
    await migrateAndQuit(argv.migrate);
  } else {
    await startup();
  }
};

entry().catch((error) => {
  logger.prettyError(error);
  logger.fatal('Encountered an error during startup, application will now exit');
  process.exit(1);
});
