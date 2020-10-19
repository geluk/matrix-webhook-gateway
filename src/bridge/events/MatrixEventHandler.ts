import EventContext from './EventContext';

export default interface MatrixEventHandler {
  handleEvent(context: EventContext): Promise<boolean>;
}

export type EventMatcher = (ctx: EventContext) => boolean;
export type EventHandler = (ctx: EventContext) => Promise<boolean>;
