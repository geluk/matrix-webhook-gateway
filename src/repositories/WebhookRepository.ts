import WebHook from '../models/WebHook';
import logger from '../util/logger';
import Database from './Database';

export default class WebhookRepository {
  database: Database;

  public constructor(database: Database) {
    this.database = database;
  }

  public async add(entity: WebHook): Promise<number> {
    return this.database.knex('webhook').insert(entity);
  }
}
