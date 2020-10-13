


import { Cli, Bridge, AppServiceRegistration, MatrixUser, WeakEvent, Request, BridgeContext } from "matrix-appservice-bridge";

export default class AppService {

    private bridge: Bridge;
    private cli: Cli<Record<string, unknown>>;

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

    static create(): AppService {
        let appservice = new AppService();
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
        if (event.type === "m.room.message") {
            console.log(`New message: ${event.content.body}`);
            if (event.sender != this.bridge.getBot().getUserId()) {
                this.bridge.getIntent().sendMessage(event.room_id, {
                    msgtype: "m.text",
                    body: "PONG"
                });
            }
        } else if (event.type === "m.room.member" && event.content.membership === "invite") {
            console.log(`${event.state_key} was invited to ${event.room_id}`);
            if (event.state_key === this.bridge.getBot().getUserId()) {
                console.log(`Accepting invite.`);
                this.bridge.getIntent(event.state_key)
                    .join(event.room_id);
            }
        }else {
            console.log(`Event ignored: ${event.type}`);
            return;
        }
        return;
    }
}

