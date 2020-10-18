import Webhook from '../models/Webhook';
import logger from '../util/logger';
import Database from './Database';

export default class WebhookRepository {
  database: Database;

  public constructor(database: Database) {
    this.database = database;
  }

  public async add(entity: Webhook): Promise<number> {
    return this.database.knex('webhook').insert(entity);
  }

  public async deleteFromRoom(webhook_id: number, room_id: string): Promise<boolean> {
    logger.debug(`Attempting to delete webhook #${webhook_id} from room ${room_id}`);
    return this.database.knex<Webhook>('webhook')
      .where('id', '=', webhook_id)
      .andWhere('room_id', '=', room_id)
      .delete();
  }

  public async findByRoom(room_id: string): Promise<Webhook[]> {
    logger.debug(`Looking up webhooks for room ${room_id}`);
    return this.database.knex<Webhook>('webhook')
      .where('room_id', '=', room_id);
  }

  public async getByPath(path: string): Promise<Webhook | undefined> {
    logger.debug(`Looking up webhook for path '${path}'`);
    return this.database.knex<Webhook>('webhook')
      .where('path', '=', path.toLowerCase())
      .first();
  }
}
