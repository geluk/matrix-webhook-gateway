import * as Knex from 'knex';
import { is } from 'typescript-is';
import DatabaseConfiguration from '../configuration/DatabaseConfiguration';
import User from '../models/User';
import Webhook from '../models/Webhook';
import logger, { getKnexLogger } from '../util/logger';
import toSnakeCase from '../util/toSnakeCase';

export type Model =
  | User
  | Webhook;

export type MigrationResult = [
  number,
  string[],
];

export interface MigrationStatus {
  pending: PendingMigration[];
  completed: string[];
}

type KnexMigrationStatus = [
  string[],
  PendingMigration[],
];

interface PendingMigration {
  file: string,
  directory: string,
}

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
    const migrations = await this.getMigrationStatus();
    if (migrations.pending.length === 0) {
      logger.debug('There are no pending migrations');
      return;
    }
    if (migrations.pending.length === 1) {
      logger.info('There is one pending migration');
    } else {
      logger.info(`There are ${migrations} pending migrations`);
    }
    const result = await this._knex.migrate.latest();
    if (is<MigrationResult>(result)) {
      result[1].forEach((migration) => {
        logger.info(` - ${migration}`);
      });
    }
    logger.info('Migration finished');
  }

  public async migrateBy(requestedMigrations: number): Promise<void> {
    if (requestedMigrations === 0) {
      logger.info('No migrations requested, nothing to do');
      return;
    }
    const migrations = await this.getMigrationStatus();

    if (migrations.completed.length === 1) {
      logger.info('There is one completed migration');
    } else {
      logger.info(`There are ${migrations.completed.length} completed migrations`);
    }
    if (migrations.pending.length === 1) {
      logger.info('There is one pending migration');
    } else {
      logger.info(`There are ${migrations.pending.length} pending migrations`);
    }
    if (requestedMigrations > 0 && migrations.pending.length < requestedMigrations) {
      throw new Error(
        `Unable to perform ${requestedMigrations} migration(s) up. There aren't that many pending migrations.`,
      );
    }
    if (requestedMigrations < 0 && migrations.completed.length < Math.abs(requestedMigrations)) {
      throw new Error(
        `Unable to perform ${Math.abs(requestedMigrations)} migration(s) down. There aren't that many completed migrations.`,
      );
    }

    if (requestedMigrations > 0) {
      logger.info(`Migrating up by ${requestedMigrations} migration(s)`);
      for (let i = 0; i < requestedMigrations; i += 1) {
        const [, [migration]] = await this._knex.migrate.up();
        logger.info(` - ${migration}`);
      }
    } else {
      logger.info(`Migrating down by ${Math.abs(requestedMigrations)} migration(s)`);
      for (let i = 0; i < Math.abs(requestedMigrations); i += 1) {
        const [, [migration]] = await this._knex.migrate.down();
        logger.info(` - ${migration}`);
      }
    }
  }

  public async assertConnected(): Promise<void> {
    await this._knex.raw('select 1+1 as connection_test');
  }

  public async getMigrationStatus(): Promise<MigrationStatus> {
    logger.silly('Retrieving migration status');
    const migrations = await this._knex.migrate.list();
    if (!is<KnexMigrationStatus>(migrations)) {
      logger.error('Failed to read migration status: ', migrations);
      throw new Error('Unable to retrieve migration status');
    }
    return {
      completed: migrations[0],
      pending: migrations[1],
    };
  }
}
