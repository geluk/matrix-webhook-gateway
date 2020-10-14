import EventContext from './EventContext';
import MatrixEventHandler, { EventMatcher, EventHandler } from './MatrixEventHandler';

export default class GenericEventHandler implements MatrixEventHandler {
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
