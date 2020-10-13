

import MatrixBridge from "./src/MatrixBridge"
import WebHook from "./src/WebHook";

import * as knex from "knex"
import User from "./src/models/User";
import WebhookService from "./src/WebhookService";

function toSnakeCase(value: string): string {
    return value.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
}

const config: knex.Config = {
    "client": "sqlite3",
    "connection": {
        "filename": "appservice-db.sqlite",
    },
    "wrapIdentifier": (value, origImpl, queryContext) => origImpl(toSnakeCase(value)),
    "useNullAsDefault": true // Required for SQLite support
}

const db = knex(config);

const fn = async () => {
    const u = await db.select().from<User>("user");
    console.log(u);
}

fn();


const whs = new WebhookService(new MatrixBridge());
whs.start();

const webHook = new WebHook();