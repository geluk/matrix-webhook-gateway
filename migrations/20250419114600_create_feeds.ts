import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('feeds', (table) => {
    table.string('url', 1024).primary().notNullable();
    table.string('cursor', 1024).notNullable();
    table.timestamp('last_retrieved').notNullable();
    table.text('cache_details', 'mediumtext').notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('feeds');
}
