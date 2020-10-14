import { Bridge, WeakEvent } from 'matrix-appservice-bridge';

export default class EventContext {
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
