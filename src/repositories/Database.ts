import * as Knex from 'knex';
import DatabaseConfiguration from '../configuration/DatabaseConfiguration';
import User from '../models/User';
import Webhook from '../models/Webhook';
import logger, { getKnexLogger } from '../util/logger';
import toSnakeCase from '../util/toSnakeCase';

export type Model =
  | User
  | Webhook;

export default class Database {
  private _knex: Knex<Model, unknown[]>;

  public constructor(config: DatabaseConfiguration) {
    logger.debug(`Creating DB connection with ${config.driver}`);
    const knexConfig: Knex.Config = {
      debug: false, // Set to true to enable query debugging
      log: getKnexLogger(),
      client: config.driver,
      connection: config.connection,
      wrapIdentifier: (value, origImpl) => origImpl(toSnakeCase(value)),
      useNullAsDefault: true, // Required for SQLite support
      pool: {
        // Type annotations are not available here.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        afterCreate: (conn: any, done: any) => {
          if (config.driver === 'sqlite3') {
            // On SQLite, foreign keys are disabled by default.
            // See https://github.com/knex/knex/issues/453
            conn.run('PRAGMA foreign_keys = ON;', done);
          } else {
            done(false, conn);
          }
        },
      },
    };
    this._knex = Knex.default(knexConfig);
  }

  public get knex(): Knex<Model, unknown[]> {
    return this._knex;
  }

  public async migrate(): Promise<void> {
    let migrations: number;
    try {
      logger.silly('Retrieving migration status');
      migrations = Math.abs(await this._knex.migrate.status());
    } catch {
      // This may have failed if we haven't executed the initial migration yet.
      // Let's try that first. If something else is wrong, this will also throw
      // and stop the migration process.
      await this._knex.migrate.up();
      logger.info('Created initial database structure');
      // If it succeeded, we should now be able to request the migration status.
      migrations = Math.abs(await this._knex.migrate.status());
    }
    if (migrations === 0) {
      logger.debug('There are no pending migrations');
      return;
    }
    if (migrations === 1) {
      logger.info('There is one pending migration');
    } else {
      logger.info(`There are ${migrations} pending migrations`);
    }
    const result = await this._knex.migrate.latest();
    if (result[1]) {
      const migrationResults = result[1] as string[];
      migrationResults.forEach((mres) => {
        logger.info(` - ${mres}`);
      });
    }
    logger.info('Migration finished');
  }
}
