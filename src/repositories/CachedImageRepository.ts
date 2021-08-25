import hasha from 'hasha';
import { assertType } from 'typescript-is';
import CachedImage, { CacheDetails } from '../models/CachedImage';
import logger from '../util/logger';
import Database from './Database';

export interface CachedImageRepository {
  addOrUpdate(entity: CachedImage): Promise<void>;
  findByUrl(url: string): Promise<CachedImage | undefined>;
  updateCacheDetails(urlHash: string, cacheDetails: CacheDetails): Promise<void>;
}

export interface CachedImageRepr {
  url_hash: string;
  original_url: string;
  matrix_url: string;
  last_retrieved: Date;
  content_hash: string;
  cache_details: string;
}

export default class CachedImageFromDatabase implements CachedImageRepository {
  database: Database;

  public constructor(database: Database) {
    this.database = database;
  }

  public async addOrUpdate(entity: CachedImage): Promise<void> {
    logger.debug(`Adding cached image with hash ${entity.url_hash}`);

    const repr: CachedImageRepr = {
      url_hash: entity.url_hash,
      original_url: entity.original_url,
      matrix_url: entity.matrix_url,
      last_retrieved: entity.last_retrieved,
      content_hash: entity.content_hash,
      cache_details: JSON.stringify(entity.cache_details),
    };

    await this.database.knex<CachedImageRepr>('uploaded_image')
      .insert(repr);
  }

  public async findByUrl(url: string): Promise<CachedImage | undefined> {
    const urlHash = hasha(url, {
      algorithm: 'sha256',
      encoding: 'base64',
    });
    return this.findByHash(urlHash);
  }

  private async findByHash(urlHash: string): Promise<CachedImage | undefined> {
    logger.debug(`Looking up cached image with hash ${urlHash}`);
    const repr = await this.database.knex<CachedImageRepr>('uploaded_image')
      .where('url_hash', '=', urlHash)
      .first();

    if (repr) {
      try {
        const details = JSON.parse(repr.cache_details);
        details.revalidateAfter = new Date(details.revalidateAfter);
        assertType<CacheDetails>(details);
        repr.cache_details = details;
      } catch (error) {
        logger.warn('Failed to look up image cache details: ', error);
        (repr as unknown as CachedImage).cache_details = null;
      }
      return repr as unknown as CachedImage;
    }
    return undefined;
  }

  public async updateCacheDetails(urlHash: string, cacheDetails: CacheDetails): Promise<void> {
    logger.debug(`Updating revalidateAfter for ${urlHash}`);
    return this.database.knex<CachedImageRepr>('uploaded_image')
      .where('url_hash', '=', urlHash)
      .update({
        cache_details: JSON.stringify(cacheDetails),
        last_retrieved: new Date(),
      });
  }
}
