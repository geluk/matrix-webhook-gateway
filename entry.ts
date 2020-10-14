import * as Knex from 'knex';

import MatrixBridge from './src/MatrixBridge';
import WebHook from './src/WebHook';
import User from './src/models/User';
import WebhookService from './src/WebhookService';

import toSnakeCase from './src/util/toSnakeCase';
import logger from './src/util/logger';

const config: Knex.Config = {
  client: 'sqlite3',
  connection: {
    filename: 'appservice-db.sqlite',
  },
  wrapIdentifier: (value, origImpl) => origImpl(toSnakeCase(value)),
  useNullAsDefault: true, // Required for SQLite support
};

const db = Knex.default(config);

const fn = async () => {
  await db.select().from<User>('user');
};

fn();

const whs = new WebhookService(new MatrixBridge());
whs.start();

const webHook = new WebHook();
