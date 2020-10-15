import ConnectionConfiguration from './ConnectionConfiguration';

export default class DatabaseConfiguration {
  driver: string;

  connection: ConnectionConfiguration;

  // We rely on schema validation ensure that all properties are of the
  // correct type, so we can safely assert the types of all properties here.
  // In the case of optional properties, we only need to perform null/undefined
  // checks, and replace those values with their defaults.
  /* eslint-disable @typescript-eslint/explicit-module-boundary-types */
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  public constructor(config: any) {
    this.driver = config.driver ?? 'sqlite3';
    this.connection = new ConnectionConfiguration(config.connection);
  }
}
