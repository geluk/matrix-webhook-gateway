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
    logger.debug(`Attempting to delete webhook #${webhook_id} from room ${room_id}`);
    return this.database.knex<WebHook>('webhook')
      .where('id', '=', webhook_id)
      .andWhere('room_id', '=', room_id)
      .delete();
  }

  public async findByRoom(room_id: string): Promise<WebHook[]> {
    logger.debug(`Looking up webhooks for room ${room_id}`);
    return this.database.knex<WebHook>('webhook')
      .where('room_id', '=', room_id);
  }

  public async getByPath(path: string): Promise<WebHook | undefined> {
    logger.debug(`Looking up webhook for path '${path}'`);
    return this.database.knex<WebHook>('webhook')
      .where('path', '=', path.toLowerCase())
      .first();
  }

  public async count(): Promise<number> {
    logger.debug('Counting total number of webhook');
    return this.database.knex<WebHook>('webhook')
      .count();
  }
}
