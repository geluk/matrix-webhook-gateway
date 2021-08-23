import { is } from 'typescript-is';
import MatrixBridge from '../bridge/MatrixBridge';
import WebhooksConfiguration from '../configuration/WebhooksConfiguration';
import Webhook from '../models/Webhook';
import WebhookRepository from '../repositories/WebhookRepository';
import logger from '../util/logger';
import { WebhookContent } from './formats';
import {
  WebhookResult, WebhookMessageV2, WebhookMessageV1,
} from './pluginApi';
import PluginCollection from './PluginCollection';
import transformWebhook from './transformWebhook';

export interface Request {
  path: string,
  body: unknown,
}

export interface Match {
  webhook: Webhook,
  pluginName?: string,
}

export default class Matcher {
  public constructor(
    private webhookRepository: WebhookRepository,
    private plugins: PluginCollection,
  ) {
  }

  public load(): Promise<void> {
    return this.plugins.load();
  }

  public async matchRequest(path: string, plugin: string | undefined): Promise<Match | undefined> {
    const webhook = await this.webhookRepository.getByPath(`/hook/${path}`);
    if (!webhook) {
      logger.debug('Webhook not found.');
      return undefined;
    }
    return {
      webhook,
      pluginName: plugin,
    };
  }

  public async executeHook(match: Match, request: Request): Promise<WebhookResult | undefined> {
    if (match.pluginName === undefined) {
      if (is<WebhookContent>(request.body)) {
        return {
          webhook: match.webhook,
          content: transformWebhook(request.body),
        };
      }
      logger.warn('Received an unrecognised webhook: ', request.body);
      return undefined;
    }

    if (!this.plugins.acceptsType(match.pluginName)) {
      logger.warn(`Received an unrecognised webhook type: ${match.pluginName}`);
      return undefined;
    }

    logger.debug(`Invoking plugin: '${match.pluginName}'`);
    const content = await this.plugins.apply(request.body, match.pluginName);
    if (content === undefined) {
      logger.debug(`Plugin '${match.pluginName}' rejected the webhook.`);
      return undefined;
    }
    if (is<WebhookMessageV2>(content)) {
      return {
        webhook: match.webhook,
        content,
      };
    }
    if (is<WebhookMessageV1>(content)) {
      return {
        webhook: match.webhook,
        content,
      };
    }
    logger.warn(`Plugin '${match.pluginName}' returned invalid content:`, content);
    return undefined;
  }
}
