import * as Knex from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("user", (table) => {
        table.increments("id");
        table.string("local_part")
            .notNullable();
    })
    .createTable("webhook", (table) => {
        table.increments("id");
        table.string("path")
            .notNullable();
        table.integer("user_id")
            .references("id")
            .inTable("user")
            .onDelete("CASCADE");
    });
}


export async function down(knex: Knex): Promise<void> {
}

