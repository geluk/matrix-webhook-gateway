import { is } from 'typescript-is';
import { a, fmt, ul } from '../../src/formatting/formatting';
import { WebhookMessageV2 } from '../../src/webhooks/formats';
import { WebhookPluginV2 } from '../../src/webhooks/PluginCollection';

type AlertStatus = 'resolved' | 'firing';

export interface PrometheusWebhook {
  version: '4',
  groupKey: string,
  truncatedAlerts: number,
  status: AlertStatus,
  receiver: string,
  groupLabels: Record<string, unknown>,
  commonLabels: Record<string, unknown>,
  commonAnnotations: Record<string, unknown>,
  externalURL: string,
  alerts: Alert[],
}

interface Alert {
  status: AlertStatus,
  labels: Record<string, unknown>,
  annotations: Record<string, unknown>,
  startsAt: string,
  endsAt: string,
  generatorURL: string,
}

const alertStatusIcon: Record<AlertStatus, string> = {
  resolved: '🟢',
  firing: '🔴',
};

const plugin: WebhookPluginV2 = {
  format: 'prometheus',
  version: '2',
  init() { },
  transform(body: unknown): WebhookMessageV2 | undefined {
    if (!is<PrometheusWebhook>(body)) {
      return undefined;
    }
    const icon = alertStatusIcon[body.status];
    const makeAlert = (alert: Alert) => fmt(
      alert.annotations.summary as string,
      ' (',
      a(alert.generatorURL, 'view'),
      ')',
    );

    return {
      version: '2',
      username: 'Prometheus',
      icon: {
        url: 'https://prometheus.io/assets/favicons/android-chrome-192x192.png',
      },
      text: fmt(
        icon,
        ul(
          body.alerts.map(makeAlert),
        ),
      ),
    };
  },
};

export default plugin;
