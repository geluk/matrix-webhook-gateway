import GenericEventHandler from './GenericEventHandler';
import MatrixEventHandler, { EventHandler, EventMatcher } from './MatrixEventHandler';

export default class MatrixEventHandlers {
  static eventType(eventType: string, handler: EventHandler): MatrixEventHandler {
    const typeMatch: EventMatcher = (ctx) => ctx.event.type === eventType;
    return new GenericEventHandler(typeMatch, handler);
  }

  static invite(handler: EventHandler): MatrixEventHandler {
    const typeMatch: EventMatcher = (ctx) => ctx.event.type === 'm.room.member'
      && ctx.event.content.membership === 'invite';
    return new GenericEventHandler(typeMatch, handler);
  }
}
