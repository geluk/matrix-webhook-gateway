import { Bridge, WeakEvent } from "matrix-appservice-bridge";

type EventMatcher = (evt: WeakEvent) => boolean;
type EventHandler = (evt: WeakEvent, bridge: Bridge) => any;

export default class MatrixEventHandler {
    eventMatcher: EventMatcher;
    handler: EventHandler;

    public constructor(eventMatcher: EventMatcher, handler: EventHandler) {
        this.eventMatcher = eventMatcher;
        this.handler = handler;
    }

    static eventType(eventType: string, handler: EventHandler): MatrixEventHandler {
        let typeMatch: EventMatcher = (evt) => evt.type === eventType;
        return new MatrixEventHandler(typeMatch, handler);
    }

    static message(handler: EventHandler): MatrixEventHandler {
        return this.eventType("m.room.message", handler);
    }

    static invite(handler: EventHandler): MatrixEventHandler {
        let typeMatch: EventMatcher = (evt) => {
            return evt.type === "m.room.member" &&
            evt.content.membership === "invite"
        }
        return new MatrixEventHandler(typeMatch, handler);
    }

    public handle(event: WeakEvent, bridge: Bridge): boolean {
        if(this.eventMatcher(event)) {
            this.handler(event, bridge);
            return true;
        }
        return false;
    }
}