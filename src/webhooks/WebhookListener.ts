import * as Express from 'express';
import { Request, Response, NextFunction } from 'express';
import WebhooksConfiguration from '../configuration/WebhooksConfiguration';
import HookCallRepository from '../repositories/HookCallRepository';
import logger from '../util/logger';
import Observable from '../util/Observable';
import Matcher, { WebhookResult } from './Matcher';

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
    this.app.use((
      err: Error & Record<string, unknown>,
      _rq: Request,
      rs: Response,
      _next: NextFunction,
    ) => {
      if ('type' in err && err.type === 'entity.parse.failed') {
        logger.debug('Client sent malformed request: ', err.message);
        rs.status(400).send(`Bad Request: ${err.message}`).end();
      } else {
        logger.info('Error parsing request body: ', err);
        rs.status(400).send('Bad Request').end();
      }
    });

    this.app.get('/', (rq, rs) => {
      rs.status(200).send('Webhook gateway ready.').end();
    });

    this.app.post('/hook/:hook', this.handleRequest.bind(this));
    this.app.post('/hook/:hook/:plugin', this.handleRequest.bind(this));

    this.app.use('/*', (rq, rs) => {
      rs.status(404).send('Not Found').end();
    });

    this.app.use((err: unknown, _rq: unknown, rs: Response, _next: NextFunction) => {
      logger.error(err);
      rs.status(500).send('Internal Server Error').end();
    });

    this.app.listen(this.config.listen_port, this.config.listen_host, () => {
      logger.info(`Web server running on ${this.config.listen_host}:${this.config.listen_port}`);
    });
  }

  private async handleRequest(rq: Request, rs: Response, _next: NextFunction) {
    const path = rq.params.hook;
    const plugin = rq.params.plugin as string | undefined;

    if (plugin) {
      logger.debug(`Looking up webhook '${path}' with plugin '${plugin}'`);
    } else {
      logger.debug(`Looking up webhook '${path}'`);
    }

    const replaceEmoji = !('ignore_emoji' in rq.query);

    let match;
    try {
      match = await this.webhookMatcher.matchRequest(path, plugin);
    } catch (error) {
      logger.error('Failed to match webhook: ', error);
    }
    if (!match) {
      rs.status(404).send('Not Found').end();
      return;
    }

    if (this.config.log_to_database) {
      try {
        this.hookCallRepository.add({
          hook_id: match.webhook.id,
          content: JSON.stringify(rq.body),
          timestamp: new Date(),
        });
      } catch (error) {
        logger.error('Error inserting hook call details into database: ', error);
      }
    }

    let result;
    try {
      result = await this.webhookMatcher.executeHook(match, rq, { replaceEmoji });
    } catch (error) {
      logger.error(`An error occurred while executing plugin ${match.pluginName}`, error);
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
