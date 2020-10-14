import {
  Cli, Bridge, AppServiceRegistration, MatrixUser, WeakEvent, Request,
} from 'matrix-appservice-bridge';

import MatrixEventHandler from './MatrixEventHandler';
import EventContext from './EventContext';
import logger from '../util/logger';

type RegistrationCallback = (r: AppServiceRegistration) => void;

const bridgeLog = logger.getChildLogger({
  name: 'bridge',
});

const BRIDGE_PORT = 8023;

export default class MatrixBridge {
  private bridge: Bridge;

  private cli: Cli<Record<string, unknown>>;

  private eventHandlers: MatrixEventHandler[] = [];

  public constructor() {
    this.bridge = new Bridge({
      homeserverUrl: 'http://127.0.0.1:8008',
      domain: 'matrix.local',
      registration: 'registration.yaml',
      disableStores: true,
      controller: {
        onUserQuery: this.handleUserQuery.bind(this),
        onLog: this.handleLog.bind(this),
        onEvent: this.handleEvent.bind(this),
      },
    });
    this.cli = new Cli({
      registrationPath: '',
      generateRegistration: this.generateRegistration,
      run: this.onStart.bind(this),
    });
  }

  public async sendMessage(target: string, message: string): Promise<unknown> {
    return this.bridge.getIntent().sendMessage(target, {
      body: message,
      msgtype: 'm.text',
    });
  }

  public registerHandler(eventHandler: MatrixEventHandler): void {
    this.eventHandlers.push(eventHandler);
  }

  public start(): void {
    this.cli.run();
  }

  private onStart(_: number, config: Record<string, unknown> | null) {
    logger.info(`Matrix bridge running on port ${BRIDGE_PORT}`);
    this.bridge.run(BRIDGE_PORT, config);
  }

  private handleUserQuery(user: MatrixUser): Record<string, unknown> {
    logger.info(`User provision requested: ${user.localpart}:${user.host}`);
    return {};
  }

  private handleLog(text: string, isError: boolean) {
    if (isError) {
      bridgeLog.error(text);
    } else {
      bridgeLog.silly(text);
    }
  }

  private generateRegistration(reg: AppServiceRegistration, callback: RegistrationCallback) {
    reg.setId(AppServiceRegistration.generateToken());
    reg.setHomeserverToken(AppServiceRegistration.generateToken());
    reg.setAppServiceToken(AppServiceRegistration.generateToken());
    reg.setSenderLocalpart('webhook');
    reg.addRegexPattern('users', '@hook_.*', true);
    callback(reg);
  }

  private handleEvent(request: Request<WeakEvent>) {
    const event = request.getData();
    const context = new EventContext(event, this.bridge);
    const handled = this.eventHandlers.some((h) => h.handleEvent(context));

    if (!handled) {
      logger.info(`Event ignored: ${event.type}`);
    }
  }
}
