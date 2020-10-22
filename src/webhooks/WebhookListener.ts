import * as Express from 'express';
import { Request, Response, NextFunction } from 'express';
import WebhooksConfiguration from '../configuration/WebhooksConfiguration';
import logger from '../util/logger';
import Observable from '../util/Observable';
import { HookCall } from './formats';
import Matcher from './Matcher';

export default class WebhookListener {
  private app = Express.default();

  public onHookCall = new Observable<HookCall>();

  public constructor(
    private config: WebhooksConfiguration,
    private webhookMatcher: Matcher,
  ) { }

  public start(): void {
    logger.silly('Starting webhook listener');
    this.app.use(Express.json());

    this.app.get('/hook/*', this.handleRequest.bind(this));
    this.app.post('/hook/*', this.handleRequest.bind(this));

    this.app.use((err: unknown, _req: unknown, res: Response, _next: NextFunction) => {
      logger.error(err);
      res.status(500).send('Internal Server Error');
    });

    this.app.listen(this.config.listen_port, this.config.listen_host, () => {
      logger.info(`Web server running on ${this.config.listen_host}:${this.config.listen_port}`);
    });
  }

  private async handleRequest(rq: Request, rs: Response) {
    logger.debug(`${rq.method} ${rq.url}`);
    logger.silly(`${rq.body}`);
    const match = await this.webhookMatcher.matchRequest(rq);
    if (match) {
      rs.send('Ok');
      this.onHookCall.notify(match).catch((error) => {
        logger.error('Failed to handle webhook invocation: ', error);
      });
    } else {
      rs.status(404).send('Not Found');
    }
  }
}
