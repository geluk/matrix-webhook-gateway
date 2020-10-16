export default class Observable<TMessage> {
  handlers: ((message: TMessage) => Promise<void>)[];

  public constructor() {
    this.handlers = [];
  }

  public observe(handler: (message: TMessage) => Promise<void>): void {
    this.handlers.push(handler);
  }

  public async notify(message: TMessage): Promise<void> {
    await Promise.all(this.handlers.map((h) => h(message)));
  }
}
