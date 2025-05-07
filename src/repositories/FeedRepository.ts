import { Feed } from '../feeds/Feed';
import Database from './Database';

export default class HookCallRepository {
  database: Database;

  public constructor(database: Database) {
    this.database = database;
  }

  public async add(entity: Feed): Promise<void> {
    await this.database.knex<Feed>('feed')
      .insert(entity);
  }
}

