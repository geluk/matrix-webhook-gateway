import Parser from 'rss-parser';
import { is } from 'typia';

import logger from '../util/logger';
import { Feed, Item } from '../models/Feed';
import { DownloadResponse } from '../downloads/downloader';
import CacheDetails from '../models/CacheDetails';

export default class FeedService {
  private parser: Parser = new Parser();
  public constructor(
    private downloader: {
      needsDownload: (cacheDetails?: CacheDetails) => boolean;
      download: (
        url: string,
        cacheDetails?: CacheDetails,
      ) => Promise<DownloadResponse>;
    },
  ) {}

  async getItems(url: string): Promise<Item[]> {
    const feed = await this.parser.parseURL(url);

    return feed.items.flatMap((i) => {
      logger.info(i);

      if (is<Item>(i)) {
        return [i];
      }
      return [];
    });
  }

  public async updateFeed(feed: Feed) {
    // const s = this.downloader(
    // throw new Error('TODO');
  }
}
