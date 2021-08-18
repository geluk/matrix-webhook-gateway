import * as Express from 'express';
import { Request, Response, NextFunction } from 'express';
import WebhooksConfiguration from '../configuration/WebhooksConfiguration';
import HookCallRepository from '../repositories/HookCallRepository';
import logger from '../util/logger';
import Observable from '../util/Observable';
import { WebhookResult } from './pluginApi';
import Matcher from './Matcher';

export default class WebhookListener {
  private app = Express.default();

  public onWebhookResult = new Observable<WebhookResult>();

  public constructor(
    private config: WebhooksConfiguration,
    private webhookMatcher: Matcher,
    private hookCallRepository: HookCallRepository,
  ) { }

  public async start(): Promise<void> {
    logger.silly('Starting webhook listener');
    await this.webhookMatcher.load();
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
    let match;
    try {
      match = await this.webhookMatcher.matchRequest(rq);
    } catch (error) {
      logger.error('Failed to match webhook:');
      logger.prettyError(error);
    }
    if (!match) {
      rs.status(404).send('Not Found').end();
      return;
    }

    try {
      this.hookCallRepository.add({
        hook_id: match.webhook.id,
        content: JSON.stringify(rq.body),
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error('Error inserting hook call details into database: ', error);
    }
    let result;
    try {
      result = await this.webhookMatcher.executeHook(match, rq);
    } catch (error) {
      logger.error(`An error occurred while executing plugin ${match.pluginName}`);
    }
    if (result) {
      logger.silly('Request body: ', rq.body);
      this.onWebhookResult.notify(result).catch((error) => {
        logger.error('Failed to handle webhook invocation: ', error);
      });
    }
    rs.status(200).send('Ok').end();
  }
}
