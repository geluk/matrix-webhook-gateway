export default class WebhooksConfiguration {
  public listen_host: string;

  public listen_port: number;

  public public_url: string;

  public plugin_directory: string;

  public plugin_cache_directory: string;

  public log_to_database: boolean;

  // We rely on schema validation ensure that all properties are of the
  // correct type, so we can safely assert the types of all properties here.
  // In the case of optional properties, we only need to perform null/undefined
  // checks, and replace those values with their defaults.
  /* eslint-disable @typescript-eslint/explicit-module-boundary-types */
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  public constructor(config: any) {
    this.listen_host = config.listen_host ?? '0.0.0.0';
    this.listen_port = config.listen_port ?? 8020;
    this.public_url = config.public_url;
    this.plugin_directory = config.plugin_directory ?? './plugins';
    this.plugin_cache_directory = config.plugin_cache_directory ?? './plugins/__cache';
    this.log_to_database = config.log_to_database ?? false;
  }
}
