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

  public async update(entity: Webhook) {
    return this.database.knex<Webhook>('webhook')
    .where('id', '=', entity.id).update(entity)
    .update(entity);
  }

  public async deleteFromRoom(webhookId: number, roomId: string): Promise<boolean> {
    logger.debug(`Attempting to delete webhook #${webhookId} from room ${roomId}`);
    return this.database.knex<Webhook>('webhook')
      .where('id', '=', webhookId)
      .andWhere('room_id', '=', roomId)
      .delete();
  }

  public async findByRoom(roomId: string, userId?: string): Promise<Webhook[]> {
    logger.debug(`Looking up webhooks for room ${roomId}`);
    let query = this.database.knex<Webhook>('webhook')
      .where('room_id', '=', roomId);
    if (userId) {
      query = query.andWhere('user_id', '=', userId);
    }
    return query;
  }

  public async getByPath(path: string): Promise<Webhook | undefined> {
    logger.debug(`Looking up webhook for path '${path}'`);
    return this.database.knex<Webhook>('webhook')
      .where('path', '=', path.toLowerCase())
      .first();
  }

  public async getById(id: number): Promise<Webhook | undefined> {
    logger.debug(`Looking up webhook for id '${id}'`);
    return this.database.knex<Webhook>('webhook')
      .where('id', '=', id)
      .first();
  }
}
