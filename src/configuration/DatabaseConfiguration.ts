import { is } from 'typescript-is';

export type ConnectionConfiguration =
  | string
  | SqliteConfiguration
  | RdbmsConfiguration;

export type SqliteConfiguration = {
  filename: string
};

export type RdbmsConfiguration = {
  host: string,
  port?: number,
  user: string,
  password: string,
  database: string,
  ssl?: TlsConfiguration,
};

export type TlsConfiguration =
  | string
  | boolean
  | Record<string, unknown>;

export default class DatabaseConfiguration {
  private constructor(public driver: string, public connection: ConnectionConfiguration) {}

  // We rely on schema validation ensure that all properties are of the
  // correct type, so we can safely assert the types of all properties here.
  // In the case of optional properties, we only need to perform null/undefined
  // checks, and replace those values with their defaults.
  /* eslint-disable @typescript-eslint/explicit-module-boundary-types */
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  public static from(config: any) {
    const driver = config.driver ?? 'sqlite3';

    const { connection } = config;
    // Knex drivers expect the key to be called 'ssl'
    if (connection.tls) {
      connection.ssl = connection.tls;
      delete connection.tls;
    }

    if (driver === 'sqlite3') {
      if (!is<SqliteConfiguration>(connection)) {
        throw new Error('Database configuration invalid for sqlite3');
      }
    } else if (typeof connection !== 'string' && !is<RdbmsConfiguration>(connection)) {
      throw new Error(`Database configuration invalid for ${driver}`);
    }

    return new DatabaseConfiguration(driver, connection);
  }
}
