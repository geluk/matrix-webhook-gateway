import User from '../models/User';
import logger from '../util/logger';
import Database from './Database';

export default class UserRepository {
  database: Database;

  public constructor(database: Database) {
    this.database = database;
  }

  public async addOrUpdate(entity: User): Promise<'added' | 'updated' | 'unchanged'> {
    const user = await this.find(entity.id);
    if (!user) {
      await this.database.knex<User>('user')
        .insert(entity);
      return 'added';
    }
    if (user.private_room_id !== entity.private_room_id) {
      await this.database.knex<User>('user')
        .where('id', '=', entity.id)
        .update({
          private_room_id: entity.private_room_id,
        });
      return 'updated';
    }
    return 'unchanged';
  }

  public async find(userId: string): Promise<User | undefined> {
    logger.debug(`Looking up user with id ${userId}`);
    return this.database.knex<User>('user')
      .where('id', '=', userId)
      .first();
  }
}
