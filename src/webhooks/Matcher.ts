import { is } from 'typescript-is';
import WebhooksConfiguration from '../configuration/WebhooksConfiguration';
import WebhookRepository from '../repositories/WebhookRepository';
import logger from '../util/logger';
import {
  HookCall, WebhookMessage, WebhookContent,
} from './formats';
import PluginCollection from './PluginCollection';
import transformWebhook from './transformWebhook';

export interface Request {
  path: string,
  body: unknown,
}

export default class Matcher {
  plugins: PluginCollection;

  public constructor(
    private webhookRepository: WebhookRepository,
    private config: WebhooksConfiguration,
  ) {
    this.plugins = new PluginCollection(config);
  }

  public async matchRequest(rq: Request): Promise<HookCall | undefined> {
    const fullPath = rq.path;

    let webhook = await this.webhookRepository.getByPath(fullPath);
    if (webhook) {
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
    const match = fullPath.match(/^(.*)\/([a-z0-9]+)$/);
    if (!match) {
      logger.debug('Webhook not found.');
      return undefined;
    }

    const [path, type] = match.slice(1);
    webhook = await this.webhookRepository.getByPath(path);
    if (!webhook) {
      logger.debug('Webhook not found.');
      return undefined;
    }

    logger.debug(`Received typed webhook (type: '${type}')`);
    this.plugins.load();
    if (!this.plugins.acceptsType(type)) {
      logger.warn(`Received an unrecognised webhook type: ${type}`);
      return undefined;
    }

    logger.debug(`Invoking plugin: '${type}'`);
    const content = this.plugins.apply(rq.body, type);
    if (is<WebhookMessage>(content)) {
      return {
        webhook,
        content,
      };
    }
    if (content === undefined) {
      logger.debug(`Plugin '${type}' rejected the webhook.`);
      return undefined;
    }
    logger.warn(`Plugin '${type}' returned invalid content:`, content);
    return undefined;
  }
}
