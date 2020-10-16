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
      connection: {
        filename: config.connection.filename,
        host: config.connection.host,
        port: config.connection.port,
        user: config.connection.user,
        password: config.connection.password,
        database: config.connection.database,
      },
      wrapIdentifier: (value, origImpl) => origImpl(toSnakeCase(value)),
      useNullAsDefault: true, // Required for SQLite support
    };
    this._knex = Knex.default(knexConfig);
  }

  public get knex(): Knex<Model, unknown[]> {
    return this._knex;
  }
}
