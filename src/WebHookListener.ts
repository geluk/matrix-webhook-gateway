import * as Express from 'express';
import { Request, Response, NextFunction } from 'express';
import WebhooksConfiguration from './configuration/WebhooksConfiguration';
import WebHook from './models/WebHook';
import WebhookRepository from './repositories/WebhookRepository';
import logger from './util/logger';
import Observable from './util/Observable';

export default class WebHookListener {
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
      if (!this.match(rq)) {
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
    this.app.listen(this.config.listen_port, this.config.listen_host, () => {
      logger.info(`Web server running on ${this.config.listen_host}:${this.config.listen_port}`);
    });
  }

  private async match(rq: Request): Promise<boolean> {
    const hook = await this.webhookRepository.getByPath(rq.path);
    if (!hook) {
      logger.debug('Webhook not found.');
      return false;
    }
    if (!('text' in rq.body)) {
      logger.warn('Webhook body did not contain a "text" element.');
      return false;
    }
    await this.onHookCalled.notify({
      webhook: hook,
      content: {
        text: rq.body.text,
      },
    });
    return true;
  }
}

export interface HookCall {
  webhook: WebHook;
  content: SlackWebhook;
}

interface SlackWebhook {
  text: string;
}
