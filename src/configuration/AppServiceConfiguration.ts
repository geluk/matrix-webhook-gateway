export default class AppServiceConfiguration {
  id: string;

  hs_token: string;

  as_token: string;

  user_namespace_regex: string;

  sender_localpart: string;

  rate_limited: boolean;

  url: string;

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
    this.user_namespace_regex = config.user_namespace_regex ?? '_hook_.*';
    this.sender_localpart = config.sender_localpart ?? 'webhook';
    this.rate_limited = config.rate_limited ?? true;
    this.url = config.url;
  }
}
