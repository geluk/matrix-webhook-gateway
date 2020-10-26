import { is } from 'typescript-is';

interface WebhookPlugin {
  version: '1',
  format: string,
  init?: () => void,
  transform: (body: unknown) => WebhookMessage | undefined,
}

interface WebhookMessage {
  text: string;
  username?: string;
  icon?: EmojiIcon | UrlIcon;
  format: 'plain' | 'html' | 'markdown';
}

type EmojiIcon = {
  emoji: string;
};

type UrlIcon = {
  url: string;
};

export interface PrometheusWebhook {
  version: '4',
  groupKey: string,
  truncatedAlerts: number,
  status: 'resolved' | 'firing',
  receiver: string,
  groupLabels: Record<string, unknown>,
  commonLabels: Record<string, unknown>,
  commonAnnotations: Record<string, unknown>,
  externalURL: string,
  alerts: Alert[],
}

interface Alert {
  status: 'resolved' | 'firing',
  labels: Record<string, unknown>,
  annotations: Record<string, unknown>,
  startsAt: string,
  endsAt: string,
  generatorURL: string,
}

const plugin: WebhookPlugin = {
  format: 'prometheus',
  version: '1',
  init() { },
  transform(body: unknown) {
    if (!is<PrometheusWebhook>(body)) {
      return undefined;
    }
    return {
      text: 'Hello',
      format: 'plain',
    };
  },
};

export default plugin;
