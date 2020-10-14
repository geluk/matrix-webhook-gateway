export default class Observable<TMessage> {
  handlers: ((message: TMessage) => void)[];

  public constructor() {
    this.handlers = [];
  }

  public observe(handler: (message: TMessage) => void): void {
    this.handlers.push(handler);
  }

  public notify(message: TMessage): void {
    this.handlers.forEach((h) => h(message));
  }
}
