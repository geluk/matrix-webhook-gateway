import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('user', (table) => {
    table.string('id')
      .primary()
      .notNullable();
  })
    .createTable('webhook', (table) => {
      table.increments('id');
      table.string('path')
        .notNullable()
        .unique();
      table.string('user_id')
        .references('id')
        .inTable('user')
        .onDelete('CASCADE');
    });
}

export async function down(): Promise<void> {
  // No-op
}
