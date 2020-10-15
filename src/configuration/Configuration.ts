import AppServiceConfiguration from './AppServiceConfiguration';
import DatabaseConfiguration from './DatabaseConfiguration';
import WebhooksConfiguration from './WebhooksConfiguration';

export default class Configuration {
  public app_service: AppServiceConfiguration;

  public database: DatabaseConfiguration;

  public webhooks: WebhooksConfiguration;

  // We rely on schema validation ensure that all properties are of the
  // correct type, so we can safely assert the types of all properties here.
  // In the case of optional properties, we only need to perform null/undefined
  // checks, and replace those values with their defaults.
  /* eslint-disable @typescript-eslint/explicit-module-boundary-types */
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  public constructor(config: any) {
    this.app_service = new AppServiceConfiguration(config.app_service);
    this.database = new DatabaseConfiguration(config.database);
    this.webhooks = new WebhooksConfiguration(config.webhooks);
  }
}
