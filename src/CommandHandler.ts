import Message from "./Message";
import MessageContext from "./MessageContext";
import MessageHandler from "./MessageHandler";

export class CommandHandler extends MessageHandler {

    public constructor() {
        super();
    }

    public handleMessage(context: MessageContext): boolean {
        if (context.event.sender == context.bridge.getBot().getUserId()) {
            return true;
        }
        const message = context.event.content as unknown as Message;

        if (message.body.match(/^-[A-z]/)) {
            new Command(message.body.substr(1), context).execute();
        }
        return true;
    }
}

class Command {
    private args: string[]
    private command: string;
    context: MessageContext;

    public constructor(command: string, context: MessageContext) {
        this.args = command.split(" ");
        this.command = this.args.shift()!.toLowerCase();
        this.context = context;
    }

    public execute() {
        switch (this.command) {
            case "webhook":
                this.context.reply("Creating webhook.");
                break;
            case "ping":
                this.context.reply("Pong!");
                break;
            default:
                this.context.reply("Unknown command.");
                break;
        }
    }
}