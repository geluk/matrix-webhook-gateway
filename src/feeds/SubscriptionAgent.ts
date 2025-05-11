import FeedRepository from '../repositories/FeedRepository';
import FeedService from './FeedService';

export default class SubscriptionAgent {
  public constructor(
    private feedRepository: FeedRepository,
    private feedService: FeedService,
  ) {}

  public start() {
    setTimeout(() => this.scheduleUpdate(), 1000 * 60);
  }

  private async scheduleUpdate() {
    try {
      await this.updateFeeds();
    } catch (error) {
      // TODO: do something
    } finally {
      setTimeout(() => this.scheduleUpdate(), 1000 * 60);
    }
  }

  private async updateFeeds() {
    const feeds = await this.feedRepository.getAll();
    await Promise.all(
      feeds.map((feed) => {
        return this.feedService.updateFeed(feed);
      }),
    );
  }
}
