import { is } from 'typescript-is';
import { a, cond, fmt, ul } from '../../src/formatting/formatting';
import { WebhookMessage, PluginBase } from '../../src/pluginApi/v2';

type AlertStatus = 'resolved' | 'firing';

export interface PrometheusWebhook {
  version: '4';
  groupKey: string;
  truncatedAlerts: number;
  receiver: string;
  status: AlertStatus;
  groupLabels: Record<string, string>;
  commonLabels: Record<string, string>;
  commonAnnotations: Record<string, string>;
  externalURL: string;
  alerts: Alert[];
}

interface Alert {
  status: AlertStatus;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  startsAt: string;
  endsAt: string;
  generatorURL: string;
  fingerprint: string;
}

const alertStatusIcon: Record<AlertStatus, string> = {
  resolved: '🟢',
  firing: '🔴',
};

export const format = 'prometheus';

export default class WebhookPlugin extends PluginBase {
  public async init() { }

  public async transform(body: unknown): Promise<WebhookMessage | undefined> {
    if (!is<PrometheusWebhook>(body)) {
      return undefined;
    }
    const icon = alertStatusIcon[body.status];
    const makeAlert = (alert: Alert) =>
      fmt(
        alert.annotations.summary as string,
        ' (',
        a(alert.generatorURL, 'view'),
        ')',
      );

    return {
      username: 'Prometheus',
      icon: {
        url: 'https://prometheus.io/assets/favicons/android-chrome-192x192.png',
      },
      text: fmt(
        icon,
        ` ${body.alerts.length} alert`,
        cond(body.alerts.length > 1, 's'),
        ` ${body.status}`,
        cond(body.truncatedAlerts > 0, ` (${body.truncatedAlerts} truncated)`),
        ul(...body.alerts.map(makeAlert)),
      ),
    };
  }
}
