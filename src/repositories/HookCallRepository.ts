import HookCall from '../models/HookCall';
import Database from './Database';

export default class HookCallRepository {
  database: Database;

  public constructor(database: Database) {
    this.database = database;
  }

  public async add(entity: HookCall): Promise<void> {
    await this.database.knex<HookCall>('hook_call')
      .insert(entity);
  }
}
