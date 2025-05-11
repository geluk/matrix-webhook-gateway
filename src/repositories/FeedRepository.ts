import CacheDetails, {
  parseCacheDetails,
  stringifyCacheDetails,
} from '../models/CacheDetails';
import { Feed } from '../models/Feed';
import logger from '../util/logger';
import Database from './Database';

interface FeedRepr {
  url: string;
  cursor?: string;
  cursor_kind?: string;
  last_retrieved: Date;
  cache_details: string;
}

export default class FeedRepository {
  database: Database;

  public constructor(database: Database) {
    this.database = database;
  }

  public async add(entity: Feed): Promise<void> {
    logger.debug(`Adding feed with URL ${entity.url}`);

    const { cache_details: cacheDetails, ...rest } = entity;

    await this.database.knex<FeedRepr>('feed').insert({
      cache_details: stringifyCacheDetails(cacheDetails),
      ...rest,
    });
  }

  public async getAll(): Promise<Feed[]> {
    const reprs = await this.database.knex<FeedRepr>('feed');
    return reprs.map((repr) => {
      let details;
      try {
        details = parseCacheDetails(repr.cache_details);
      } catch (error) {
        logger.warn('Failed to look up feed cache details: ', error);
      }
      return {
        ...repr,
        cache_details: details,
      };
    });
  }

  public async updateCacheDetails(
    url: string,
    cacheDetails: CacheDetails,
  ): Promise<void> {
    logger.debug(`Updating cache details for ${url}`);
    return this.database
      .knex<FeedRepr>('feed')
      .where('url', '=', url)
      .update({
        cache_details: stringifyCacheDetails(cacheDetails),
        last_retrieved: new Date(),
      });
  }
}
