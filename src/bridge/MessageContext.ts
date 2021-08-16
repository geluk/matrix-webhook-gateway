import { Bridge, WeakEvent } from 'matrix-appservice-bridge';
import MessageContent from './MessageContent';
import EventContext from './events/EventContext';
import {
  fmt, Text,
} from '../formatting/formatting';

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

  public async reply(...message: Text[]): Promise<unknown> {
    const format = fmt(...message);
    const plain = format.formatPlain();
    const html = format.formatHtml();

    const event: Record<string, string> = {
      body: plain,
      msgtype: 'm.text',
    };

    if (plain !== html) {
      event.format = 'org.matrix.custom.html';
      event.formatted_body = html;
    }

    return this.bridge.getIntent().sendMessage(this.event.room_id, event);
  }
}
