import { Bridge, WeakEvent } from 'matrix-appservice-bridge';
import Message from './Message';

export class EventContext {
  private _event: WeakEvent;

  private _bridge: Bridge;

  public constructor(event: WeakEvent, bridge: Bridge) {
    this._event = event;
    this._bridge = bridge;
  }

  get event(): WeakEvent {
    return this._event;
  }

  get bridge(): Bridge {
    return this._bridge;
  }
}

export default class MessageContext extends EventContext {
  private _message: Message;

  public constructor(event: WeakEvent, bridge: Bridge) {
    super(event, bridge);
    this._message = {
      body: event.content.body as string,
      msgtype: event.content.msgtype as 'm.text',
    };
  }

  get message(): Message {
    return this._message;
  }

  public reply(message: string) {
    this.bridge.getIntent().sendMessage(this.event.room_id, {
      body: message,
      msgtype: 'm.text',
    });
  }
}
