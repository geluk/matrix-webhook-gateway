import { Bridge, WeakEvent } from 'matrix-appservice-bridge';
import MessageContent from './MessageContent';
import EventContext from './events/EventContext';

export default class MessageContext extends EventContext {
  private _message: MessageContent;

  public constructor(event: WeakEvent, bridge: Bridge) {
    super(event, bridge);
    this._message = {
      body: event.content.body as string,
      msgtype: event.content.msgtype as 'm.text',
    };
  }

  get message(): MessageContent {
    return this._message;
  }

  public async reply(message: string): Promise<unknown> {
    return this.bridge.getIntent().sendMessage(this.event.room_id, {
      body: message,
      msgtype: 'm.text',
    });
  }
}
