import * as Express from 'express';
import { Request, Response, NextFunction } from 'express';
import WebHook from './models/WebHook';
import WebhookRepository from './repositories/WebhookRepository';
import logger from './util/logger';
import Observable from './util/Observable';

const WEBHOOK_PORT = 8020;

export default class WebHookListener {
  app: Express.Express;

  webhookRepository: WebhookRepository;

  onHookCalled = new Observable<HookCall>();

  public constructor(webhookRepository: WebhookRepository) {
    this.webhookRepository = webhookRepository;

    this.app = Express.default();
    this.app.use(Express.json());

    this.app.get('*', async (rq, rs) => {
      logger.debug(`${rq.method} ${rq.url}`);
      if (!this.match(rq)) {
        rs.status(404).send('Not Found');
      } else {
        rs.send('');
      }
    });

    this.app.post('*', async (rq, rs) => {
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
    const port = WEBHOOK_PORT;
    this.app.listen(port, () => {
      logger.info(`Web server running on port ${port}`);
    });
  }

  private async match(rq: Request): Promise<boolean> {
    const hook = await this.webhookRepository.getByPath(rq.path);
    if (!hook) {
      return false;
    }
    if (!('text' in rq.body)) {
      logger.warn('Webhook body did not contain a "text" element.');
      return false;
    }
    this.onHookCalled.notify({
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
