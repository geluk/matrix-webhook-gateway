import Parser from "rss-parser";
import { is } from "typia";

import { Item } from "./Feed";
import logger from "../util/logger";

export default class FeedService {
  private parser: Parser = new Parser();

  async getItems(url: string): Promise<Item[]> {
    const feed = await this.parser.parseURL(url);

    return feed.items.flatMap((i) => {

      logger.info(i)

      if (is<Item>(i)) {
        return [i];
      }
      return [];
    });
  }
}
