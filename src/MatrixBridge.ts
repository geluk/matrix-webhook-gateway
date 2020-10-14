import {
  Cli, Bridge, AppServiceRegistration, MatrixUser, WeakEvent, Request,
} from 'matrix-appservice-bridge';
import MatrixEventHandler from './MatrixEventHandler';
import EventContext from './EventContext';
import logger from './util/logger';

type RegistrationCallback = (r: AppServiceRegistration) => void;

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

  public registerHandler(eventHandler: MatrixEventHandler): void {
    this.eventHandlers.push(eventHandler);
  }

  public start(): void {
    this.cli.run();
  }

  private onStart(_: number, config: Record<string, unknown> | null) {
    const port = 8023;
    logger.info(`Matrix bridge running on port ${port}`);
    this.bridge.run(port, config);
  }

  private handleUserQuery(user: MatrixUser): Record<string, unknown> {
    logger.info(`User provision requested: ${user.localpart}:${user.host}`);
    return {};
  }

  private handleLog(text: string, isError: boolean) {
    if (isError) {
      logger.error(`[appservice] ${text}`);
    } else {
      logger.debug(`[appservice] ${text}`);
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
