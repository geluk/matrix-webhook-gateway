

import MatrixBridge from "./src/MatrixBridge"
import MatrixEventHandler from "./src/MatrixEventHandler";
import WebHook from "./src/WebHook";

import * as knex from "knex"
import User from "./src/models/User";

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

console.log(`Running in ${process.cwd()}`)

const db = knex(config);

const fn = async () => {
    const u = await db.select().from<User>("user");
    console.log(u);
}

fn();


const appService = MatrixBridge.create();

appService.registerHandler(MatrixEventHandler.message((event, bridge) => {
    console.log(`New message: ${event.content.body}`);

    if (event.sender != bridge.getBot().getUserId()) {
        bridge.getIntent().sendMessage(event.room_id, {
            msgtype: "m.text",
            body: "PONG"
        });
    }
}));

appService.registerHandler(MatrixEventHandler.invite((event, bridge) => {
    console.log(`${event.state_key} was invited to ${event.room_id}`);

    if (event.state_key === bridge.getBot().getUserId()) {
        console.log(`Accepting invite.`);
        bridge.getIntent(event.state_key).join(event.room_id);
    }
}));

const webHook = new WebHook();