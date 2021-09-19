import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema
    .createTable('bot_user', (table) => {
      table.string('id').primary().notNullable();
      table.string('display_name').nullable();
      table.string('avatar_hash').nullable();
    })
    .createTable('uploaded_image', (table) => {
      table.string('hash').primary().notNullable();
      table.string('original_url').notNullable();
      table.string('matrix_url').notNullable();
    });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('bot_user').dropTable('uploaded_image');
}
