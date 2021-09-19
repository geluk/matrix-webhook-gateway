import fs from 'fs';
import path from 'path';
import { Knex } from 'knex';

export type MigrationFile = {
  fullPath: string;
  typescriptFileName: string;
};

const MIGRATIONS_DIR = path.resolve('migrations');
const VALID_EXTENSIONS = ['.js', '.ts'];

const typescriptMigrationSource: Knex.MigrationSource<MigrationFile> = {
  async getMigrations(
    _loadExtensions: readonly string[],
  ): Promise<MigrationFile[]> {
    const migrations = [];

    for await (const d of await fs.promises.opendir(MIGRATIONS_DIR)) {
      const entryPath = path.join(MIGRATIONS_DIR, d.name);
      const entry = path.parse(entryPath);
      if (d.isFile() && VALID_EXTENSIONS.includes(entry.ext)) {
        migrations.push({
          fullPath: path.join(entry.dir, entry.base),
          typescriptFileName: `${entry.name}.ts`,
        });
      }
    }
    migrations.sort((a, b) =>
      a.typescriptFileName.localeCompare(b.typescriptFileName),
    );

    return migrations;
  },

  // Version 0.12 and before did not compile the migrations, so they used files
  // with a .ts extension. Since knex saves the full filename in the database,
  // we need to provide Knex with a name ending with '.ts'.
  getMigrationName(migration: MigrationFile): string {
    return migration.typescriptFileName;
  },

  getMigration(migration: MigrationFile): Knex.Migration {
    // eslint-disable-next-line
    const loadedMigration = require(migration.fullPath);
    return loadedMigration;
  },
};
export default typescriptMigrationSource;
