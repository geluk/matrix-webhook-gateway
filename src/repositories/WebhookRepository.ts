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

  public async deleteFromRoom(webhookId: number, roomId: string): Promise<boolean> {
    logger.debug(`Attempting to delete webhook #${webhookId} from room ${roomId}`);
    return this.database.knex<Webhook>('webhook')
      .where('id', '=', webhookId)
      .andWhere('room_id', '=', roomId)
      .delete();
  }

  public async findByRoom(roomId: string): Promise<Webhook[]> {
    logger.debug(`Looking up webhooks for room ${roomId}`);
    return this.database.knex<Webhook>('webhook')
      .where('room_id', '=', roomId);
  }

  public async getByPath(path: string): Promise<Webhook | undefined> {
    logger.debug(`Looking up webhook for path '${path}'`);
    return this.database.knex<Webhook>('webhook')
      .where('path', '=', path.toLowerCase())
      .first();
  }
}
