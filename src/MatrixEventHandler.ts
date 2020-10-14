import EventContext from './EventContext';

export default interface MatrixEventHandler {
  handleEvent(context: EventContext): boolean;
}

export type EventMatcher = (ctx: EventContext) => boolean;
export type EventHandler = (ctx: EventContext) => boolean;
