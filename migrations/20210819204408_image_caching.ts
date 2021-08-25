import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('image_cache', (table) => {
    table.string('url_hash', 128)
      .primary()
      .notNullable();
    table.string('original_url', 1024)
      .notNullable();
    table.string('matrix_url', 255)
      .notNullable();
    table.timestamp('last_retrieved')
      .notNullable();
    table.string('content_hash', 128)
      .notNullable();
    table.json('cache_details')
      .notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.createTable('image_cache', (table) => {
    table.string('hash')
      .primary()
      .notNullable();
    table.string('original_url')
      .notNullable();
    table.string('matrix_url')
      .notNullable();
  });
}
