

import AppService from "./src/AppService"
import MatrixEventHandler from "./src/MatrixEventHandler";
import WebHook from "./src/WebHook";

const appService = AppService.create();

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