import { AppServiceRegistration } from 'matrix-appservice-bridge';
import logger from '../util/logger';
import { templateLocalPart } from '../util/matrixUtilities';

export default class AppServiceConfiguration {
  id: string;

  hs_token: string;

  as_token: string;

  user_pattern: string;

  sender_localpart: string;

  rate_limited: boolean;

  homeserver_name: string;

  app_service_url: string;

  homeserver_url: string;

  listen_host: string;

  listen_port: number;

  bot_user_name: string;

  bot_avatar_url: string | null;

  // We rely on schema validation to ensure that all properties are of the
  // correct type, so we can safely assert the types of property values here.
  // In the case of optional properties, we only need to perform null/undefined
  // checks, and replace those values with their defaults.
  /* eslint-disable @typescript-eslint/explicit-module-boundary-types */
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  public constructor(config: any) {
    this.id = config.id ?? 'matrix-appservice';
    this.hs_token = config.hs_token;
    this.as_token = config.as_token;
    this.user_pattern = config.user_pattern ?? '@_hook_{name}_{room}';
    this.sender_localpart = config.sender_localpart ?? 'webhook';
    this.rate_limited = config.rate_limited ?? true;
    this.homeserver_name = config.homeserver_name;
    this.app_service_url = config.app_service_url;
    this.homeserver_url = config.homeserver_url ?? 'http://127.0.0.1:8008';
    this.listen_host = config.listen_host ?? '0.0.0.0';
    this.listen_port = config.listen_port ?? 8023;
    this.bot_user_name = config.bot_user_name ?? 'Webhook';
    this.bot_avatar_url = config.bot_avatar_url ?? null;
  }

  public get user_namespace_regex() {
    return templateLocalPart(this.user_pattern, '.*', '.*');
  }

  public toAppServiceRegistration(): AppServiceRegistration {
    const registration = new AppServiceRegistration(this.app_service_url);
    registration.setId(this.id);
    registration.setHomeserverToken(this.hs_token);
    registration.setAppServiceToken(this.as_token);
    registration.addRegexPattern('users', this.sender_localpart, true);
    registration.setSenderLocalpart(this.sender_localpart);
    registration.setRateLimited(this.rate_limited);
    logger.silly('Bridge configuration ', registration);
    return registration;
  }
}
