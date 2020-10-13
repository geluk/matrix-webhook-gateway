import { EventContext } from "./MessageContext";

export default interface MatrixEventHandler {
    handleEvent(context: EventContext): boolean;
}

type EventMatcher = (ctx: EventContext) => boolean;
type EventHandler = (ctx: EventContext) => any;

export class MatrixEventHandlers {
    static eventType(eventType: string, handler: EventHandler): MatrixEventHandler {
        const typeMatch: EventMatcher = (ctx) => ctx.event.type === eventType;
        return new GenericEventHandler(typeMatch, handler);
    }

    static message(handler: EventHandler): MatrixEventHandler {
        return this.eventType("m.room.message", handler);
    }

    static invite(handler: EventHandler): MatrixEventHandler {
        const typeMatch: EventMatcher = (ctx) => {
            return ctx.event.type === "m.room.member" &&
            ctx.event.content.membership === "invite"
        }
        return new GenericEventHandler(typeMatch, handler);
    }
}

class GenericEventHandler implements MatrixEventHandler {
    typeMatch: EventMatcher;
    handler: EventHandler;

    public constructor(typeMatch: EventMatcher, handler: EventHandler) {
        this.typeMatch = typeMatch;
        this.handler = handler;
    }

    handleEvent(context: EventContext): boolean {
        if (this.typeMatch(context)) {
            return this.handler(context);
        }
        return true;
    }
}