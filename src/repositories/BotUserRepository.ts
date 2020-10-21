import BotUser from '../models/BotUser';
import logger from '../util/logger';
import Database from './Database';

export default class UserRepository {
  database: Database;

  public constructor(database: Database) {
    this.database = database;
  }

  public async addOrUpdate(entity: BotUser): Promise<'added' | 'updated'> {
    logger.debug(`Updating bot user with id ${entity.id}`);
    const user = await this.find(entity.id);
    if (!user) {
      await this.database.knex<BotUser>('bot_user')
        .insert(entity);
      return 'added';
    }
    await this.database.knex<BotUser>('bot_user')
      .where('id', '=', entity.id)
      .update(entity);

    return 'updated';
  }

  public async find(userId: string): Promise<BotUser | undefined> {
    logger.debug(`Looking up bot user with id ${userId}`);
    return this.database.knex<BotUser>('bot_user')
      .where('id', '=', userId)
      .first();
  }
}
