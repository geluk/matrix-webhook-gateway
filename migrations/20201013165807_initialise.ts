import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema
    .createTable('user', (table) => {
      table.string('id').primary().notNullable();
      table.string('private_room_id').nullable();
    })
    .createTable('webhook', (table) => {
      table.increments('id');
      table.string('path').notNullable().unique();
      table.string('room_id').notNullable();
      table.string('user_id').notNullable();
    });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('user');
  await knex.schema.dropTable('webhook');
}
