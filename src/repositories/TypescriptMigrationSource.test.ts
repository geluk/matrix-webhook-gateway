import logger from '../util/logger';
import typescriptMigrationSource from './TypescriptMigrationSource';

describe('getMigrations', () => {
  test('retrieves migrations', async () => {
    const migrations = await typescriptMigrationSource.getMigrations([]);
    logger.info(migrations);
  });
});

describe('getMigrationName', () => {
  test('takes typescript filename from migration', () => {
    const name = typescriptMigrationSource.getMigrationName({
      fullPath: '/some/full/path/file.js',
      typescriptFileName: 'file.ts',
    });

    expect(name).toBe('file.ts');
  });
});
