import { is } from 'typescript-is';
import WebhookRepository from '../repositories/WebhookRepository';
import logger from '../util/logger';
import {
  HookCall, WebhookContent,
} from './formats';
import transformWebhook from './transformWebhook';

export interface Request {
  path: string,
  body: unknown,
}

export default class Matcher {
  public constructor(
    private webhookRepository: WebhookRepository,
  ) { }

  public async matchRequest(rq: Request): Promise<HookCall | undefined> {
    const webhook = await this.webhookRepository.getByPath(rq.path);
    if (!webhook) {
      logger.debug('Webhook not found.');
      return undefined;
    }
    if (!is<WebhookContent>(rq.body)) {
      logger.warn('Received an unrecognised webhook: ', rq.body);
      return undefined;
    }
    logger.silly('Transforming webhook');
    return {
      webhook,
      content: transformWebhook(rq.body),
    };
  }
}
