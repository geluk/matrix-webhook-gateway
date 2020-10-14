import * as Knex from 'knex';
import User from '../models/User';
import WebHook from '../models/WebHook';
import toSnakeCase from '../util/toSnakeCase';

const config: Knex.Config = {
  client: 'sqlite3',
  connection: {
    filename: 'appservice-db.sqlite',
  },
  wrapIdentifier: (value, origImpl) => origImpl(toSnakeCase(value)),
  useNullAsDefault: true, // Required for SQLite support
};

export type Model =
  | User
  | WebHook;

export default class Database {
  private _knex: Knex<Model, unknown[]>;

  public constructor() {
    this._knex = Knex.default(config);
  }

  public get knex(): Knex<Model, unknown[]> {
    return this._knex;
  }
}
