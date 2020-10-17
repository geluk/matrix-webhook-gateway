import AppServiceConfiguration from './AppServiceConfiguration';
import DatabaseConfiguration from './DatabaseConfiguration';
import WebhooksConfiguration from './WebhooksConfiguration';

export default class Configuration {
  private constructor(
    public app_service: AppServiceConfiguration,
    public database: DatabaseConfiguration,
    public webhooks: WebhooksConfiguration,
  ) {}

  // We rely on schema validation ensure that all properties are of the
  // correct type, so we can safely assert the types of all properties here.
  // In the case of optional properties, we only need to perform null/undefined
  // checks, and replace those values with their defaults.
  /* eslint-disable @typescript-eslint/explicit-module-boundary-types */
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  public static from(config: any) {
    const appService = new AppServiceConfiguration(config.app_service);
    const database = DatabaseConfiguration.from(config.database);
    const webhooks = new WebhooksConfiguration(config.webhooks);

    return new Configuration(appService, database, webhooks);
  }
}
