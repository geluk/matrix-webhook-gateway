import UploadedImage from '../models/UploadedImage';
import logger from '../util/logger';
import Database from './Database';

export default class UploadedImageRepository {
  database: Database;

  public constructor(database: Database) {
    this.database = database;
  }

  public async add(entity: UploadedImage): Promise<void> {
    logger.debug(`Adding uploaded image with hash ${entity.hash}`);
    await this.database.knex<UploadedImage>('uploaded_image')
      .insert(entity);
  }

  public async find(hash: string): Promise<UploadedImage | undefined> {
    logger.debug(`Looking up uploaded image with hash ${hash}`);
    return this.database.knex<UploadedImage>('uploaded_image')
      .where('hash', '=', hash)
      .first();
  }
}
