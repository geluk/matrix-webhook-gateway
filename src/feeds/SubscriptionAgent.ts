import { Feed } from "./Feed";

export default class SubscriptionAgent {

  feeds: Feed[] = [{ url: "https://xkcd.com/rss.xml" }];

  start() {
    setInterval(this.updateFeeds, 1000 * 60);
  }

  updateFeeds() {
  }
}


