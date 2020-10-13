import { Cli, Bridge, AppServiceRegistration, MatrixUser, WeakEvent, Request, BridgeContext } from "matrix-appservice-bridge";
import MatrixEventHandler from "./MatrixEventHandler"

export default class MatrixBridge {

    private bridge: Bridge;
    private cli: Cli<Record<string, unknown>>;
    private eventHandlers: MatrixEventHandler[] = [];

    private constructor() {
        this.bridge = new Bridge({
            homeserverUrl: "http://127.0.0.1:8008",
            domain: "matrix.local",
            registration: "registration.yaml",
            disableStores: true,
            controller: {
                onUserQuery: this.handleUserQuery.bind(this),
                onLog: this.handleLog.bind(this),
                onEvent: this.handleEvent.bind(this),
            }
        });
        this.cli = new Cli({
            registrationPath: "",
            generateRegistration: this.generateRegistration,
            run: this.onStart.bind(this),
        })
        console.log(`Bridge ready`);
    }

    public registerHandler(eventHandler: MatrixEventHandler) {
        this.eventHandlers.push(eventHandler);
    }

    static create(): MatrixBridge {
        let appservice = new MatrixBridge();
        appservice.start();
        return appservice;
    }

    private start() {
        this.cli.run();
    }

    private onStart(port: number, config: Record<string, unknown>) {
        console.log(`Ready on port ${port}`);
        this.bridge.run(8023, config);
    }

    private handleUserQuery(user: MatrixUser): Object {
        console.log(`User provision requested: ${user.localpart}:${user.host}`);
        return {};
    }

    private handleLog(text: string, isError: boolean){
        if (isError) {
            console.log(`[appservice] ${text}`);
        } else {
            console.error(`[appservice] ${text}`);
        }
    }

    private generateRegistration(reg: AppServiceRegistration, callback) {
        reg.setId(AppServiceRegistration.generateToken());
        reg.setHomeserverToken(AppServiceRegistration.generateToken());
        reg.setAppServiceToken(AppServiceRegistration.generateToken());
        reg.setSenderLocalpart("webhook");
        reg.addRegexPattern("users", "@hook_.*", true);
        callback(reg);
    }

    private handleEvent(request: Request<WeakEvent>, context: BridgeContext) {

        let event = request.getData();
        let handled = false;
        this.eventHandlers.forEach((h) => handled = h.handle(event, this.bridge));

        if(!handled)
        {
            console.log(`Event ignored: ${event.type}`);
            return;
        }
        return;
    }
}

