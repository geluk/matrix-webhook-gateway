import hasha from 'hasha';
import CachedImage from '../models/CachedImage';
import logger from '../util/logger';
import Database from './Database';
import {
  CacheDetails,
  parseCacheDetails,
  stringifyCacheDetails,
} from '../downloads/caching';

export interface CachedImageRepository {
  addOrUpdate(entity: CachedImage): Promise<void>;
  findByUrl(url: string): Promise<CachedImage | undefined>;
  updateCacheDetails(
    urlHash: string,
    cacheDetails: CacheDetails,
  ): Promise<void>;
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

    const { cache_details: cacheDetails, ...rest } = entity;

    await this.database.knex<CachedImageRepr>('image_cache').insert({
      cache_details: stringifyCacheDetails(cacheDetails),
      ...rest,
    });
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
    const repr = await this.database
      .knex<CachedImageRepr>('image_cache')
      .where('url_hash', '=', urlHash)
      .first();

    if (repr) {
      let details;
      try {
        details = parseCacheDetails(repr.cache_details);
      } catch (error) {
        logger.warn('Failed to look up image cache details: ', error);
      }

      return {
        ...repr,
        cache_details: details,
      };
    }
    return undefined;
  }

  public async updateCacheDetails(
    urlHash: string,
    cacheDetails: CacheDetails,
  ): Promise<void> {
    logger.debug(`Updating cache details for ${urlHash}`);
    return this.database
      .knex<CachedImageRepr>('image_cache')
      .where('url_hash', '=', urlHash)
      .update({
        cache_details: stringifyCacheDetails(cacheDetails),
        last_retrieved: new Date(),
      });
  }
}
