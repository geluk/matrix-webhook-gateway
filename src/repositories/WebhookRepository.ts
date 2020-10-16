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

  public async deleteFromRoom(webhook_id: number, room_id: string): Promise<boolean> {
    return this.database.knex<WebHook>('webhook')
      .where('id', '=', webhook_id)
      .andWhere('room_id', '=', room_id)
      .delete();
  }

  public async findByRoom(room_id: string): Promise<WebHook[]> {
    return this.database.knex<WebHook>('webhook')
      .where('room_id', '=', room_id);
  }

  public async getByPath(path: string): Promise<WebHook | undefined> {
    return this.database.knex<WebHook>('webhook')
      .where('path', '=', path.toLowerCase())
      .first();
  }

  public async count(): Promise<number> {
    return this.database.knex<WebHook>('webhook')
      .count();
  }
}
