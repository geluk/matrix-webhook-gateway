import * as Knex from 'knex';
import DatabaseConfiguration from '../configuration/DatabaseConfiguration';
import User from '../models/User';
import WebHook from '../models/WebHook';
import logger from '../util/logger';
import toSnakeCase from '../util/toSnakeCase';

export type Model =
  | User
  | WebHook;

export default class Database {
  private _knex: Knex<Model, unknown[]>;

  public constructor(config: DatabaseConfiguration) {
    logger.debug(`Opening DB connection with ${config.driver}`);
    const knexConfig: Knex.Config = {
      client: config.driver,
      connection: config.connection,
      wrapIdentifier: (value, origImpl) => origImpl(toSnakeCase(value)),
      useNullAsDefault: true, // Required for SQLite support
    };
    this._knex = Knex.default(knexConfig);
  }

  public get knex(): Knex<Model, unknown[]> {
    return this._knex;
  }

  public async migrate(): Promise<void> {
    let migrations: number;
    try {
      migrations = await this._knex.migrate.status();
    } catch {
      // This may have failed if we haven't executed the initial migration yet.
      // Let's try that first. If something else is wrong, this will also throw
      // and stop the migration process.
      await this._knex.migrate.up();
      logger.info('Created initial database structure');
      // If it succeeded, we should now be able to request the migration status.
      migrations = await this._knex.migrate.status();
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
    await this._knex.migrate.latest();
    logger.debug('Migration finished');
  }
}
