export default class ConnectionConfiguration {
  filename: string;

  host: string;

  user: string;

  password: string;

  database: string;

  // We rely on schema validation ensure that all properties are of the
  // correct type, so we can safely assert the types of all properties here.
  // In the case of optional properties, we only need to perform null/undefined
  // checks, and replace those values with their defaults.
  /* eslint-disable @typescript-eslint/explicit-module-boundary-types */
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  public constructor(config: any) {
    this.filename = config.filename ?? 'webhook-db.sqlite';
    this.host = config.host ?? '';
    this.user = config.user ?? '';
    this.password = config.password ?? '';
    this.database = config.database ?? '';
  }
}
