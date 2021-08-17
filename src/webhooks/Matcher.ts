import { is } from 'typescript-is';
import MatrixBridge from '../bridge/MatrixBridge';
import WebhooksConfiguration from '../configuration/WebhooksConfiguration';
import Webhook from '../models/Webhook';
import WebhookRepository from '../repositories/WebhookRepository';
import logger from '../util/logger';
import { WebhookContent } from './formats';
import { WebhookResult, WebhookMessageV2, WebhookMessageV1 } from './pluginApi';
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
  plugins: PluginCollection;

  public constructor(
    private webhookRepository: WebhookRepository,
    private config: WebhooksConfiguration,
    bridge: MatrixBridge,
  ) {
    this.plugins = new PluginCollection(config, bridge);
  }

  public load(): Promise<void> {
    return this.plugins.load();
  }

  public async matchRequest(rq: Request): Promise<Match | undefined> {
    const fullPath = rq.path;

    let webhook = await this.webhookRepository.getByPath(fullPath);
    if (webhook) {
      return {
        webhook,
      };
    }
    const match = fullPath.match(/^(.*)\/([a-z0-9_]+)$/);
    if (!match) {
      logger.debug('Path does not conform to the format <webhook>/<plugin_identifer>.');
      return undefined;
    }

    const [path, pluginName] = match.slice(1);
    webhook = await this.webhookRepository.getByPath(path);
    if (!webhook) {
      logger.debug('Webhook not found.');
      return undefined;
    }

    logger.debug(`Received typed webhook for plugin '${pluginName}'`);
    return {
      webhook,
      pluginName,
    };
  }

  public executeHook(match: Match, request: Request): WebhookResult | undefined {
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
    const content = this.plugins.apply(request.body, match.pluginName);
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
