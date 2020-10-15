import AppServiceConfiguration from './AppServiceConfiguration';

export default class Configuration {
  public app_service: AppServiceConfiguration;

  // We rely on YAML schema validation ensure that all properties are of the
  // correct type, so we can safely assert the types of all properties here.
  // In the case of optional properties, we only need to perform null/undefined
  // check, and replace those values with their defaults.
  /* eslint-disable @typescript-eslint/explicit-module-boundary-types */
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  public constructor(config: any) {
    this.app_service = new AppServiceConfiguration(config.app_service);
  }
}
