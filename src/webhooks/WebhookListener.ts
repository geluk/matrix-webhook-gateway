import * as Express from 'express';
import { Request, Response, NextFunction } from 'express';
import { is } from 'typescript-is';
import WebhooksConfiguration from '../configuration/WebhooksConfiguration';
import WebhookRepository from '../repositories/WebhookRepository';
import logger from '../util/logger';
import Observable from '../util/Observable';
import { HookCall, WebhookContent } from './formats';
import transformWebhook from './transformWebhook';

export default class WebhookListener {
  app: Express.Express;

  webhookRepository: WebhookRepository;

  config: WebhooksConfiguration;

  onHookCalled = new Observable<HookCall>();

  public constructor(webhookRepository: WebhookRepository, config: WebhooksConfiguration) {
    this.webhookRepository = webhookRepository;
    this.config = config;

    this.app = Express.default();
    this.app.use(Express.json());

    this.app.get('/hook/*', async (rq, rs) => {
      logger.debug(`${rq.method} ${rq.url}`);
      if (!await this.match(rq)) {
        rs.status(404).send('Not Found');
      } else {
        rs.send('');
      }
    });

    this.app.post('/hook/*', async (rq, rs) => {
      logger.debug(`${rq.method} ${rq.url}`);
      if (!await this.match(rq)) {
        rs.status(404).send('Not Found');
      } else {
        rs.send('');
      }
    });

    this.app.use((err: unknown, req: unknown, res: Response, _next: NextFunction) => {
      logger.error(err);
      res.status(500).send('Internal Server Error');
    });
  }

  public start(): void {
    logger.silly('Starting webhook listener');
    this.app.listen(this.config.listen_port, this.config.listen_host, () => {
      logger.info(`Web server running on ${this.config.listen_host}:${this.config.listen_port}`);
    });
  }

  private async match(rq: Request): Promise<boolean> {
    const webhook = await this.webhookRepository.getByPath(rq.path);
    if (!webhook) {
      logger.debug('Webhook not found.');
      return false;
    }
    if (!is<WebhookContent>(rq.body)) {
      logger.warn('Received an unrecognised webhook: ', rq.body);
      return false;
    }
    try {
      logger.silly('Transforming webhook');
      const content = transformWebhook(rq.body);

      logger.silly('Invoking webhook');
      await this.onHookCalled.notify({
        webhook,
        content,
      });
    } catch (error) {
      logger.error('Failed to invoke webhook: ');
      logger.prettyError(error);
    }

    return true;
  }
}
