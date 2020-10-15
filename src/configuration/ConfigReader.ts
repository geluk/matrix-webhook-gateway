import YAML from 'js-yaml';
import fs from 'fs';
import validator from 'is-my-json-valid';

import logger from '../util/logger';
import Configuration from './Configuration';

export default class ConfigReader {
  public static readConfig(path: string): Configuration | undefined {
    let rawYaml: string;
    try {
      rawYaml = fs.readFileSync(path, 'utf8');
    } catch (error) {
      logger.error('Could not read configuration file');
      logger.error(error.message);
      return undefined;
    }
    // eslint-disable-next-line @typescript-eslint/ban-types
    let config: string | undefined | Record<string, unknown>;
    try {
      config = YAML.safeLoad(rawYaml) as string | undefined | Record<string, unknown>;
    } catch (error) {
      logger.error('Could not parse configuration file');
      logger.error(error.message);
      return undefined;
    }
    if (!config || typeof config === 'string') {
      logger.error('Config file is invalid.');
      return undefined;
    }
    try {
      return this.validateConfig(config);
    } catch (error) {
      logger.error('Could not validate configuration file');
      logger.error(error.message);
      return undefined;
    }
  }

  private static validateConfig(config: Record<string, unknown>): Configuration | undefined {
    const schema = YAML.safeLoad(fs.readFileSync('webhook-appservice.schema.yaml', 'utf8'));
    if (typeof schema !== 'object') {
      logger.error('Could not read configuration schema.');
      return undefined;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const val = validator(schema as any, {
      verbose: true,
    });
    const res = val(config, schema);
    if (!res) {
      val.errors.forEach((error) => {
        logger.error(`The field ${error.field} is ${error.message}`);
        logger.silly('Error value: ', error);
      });
      return undefined;
    }
    return new Configuration(config);
  }
}
