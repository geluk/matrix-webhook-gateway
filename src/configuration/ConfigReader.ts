import YAML from 'js-yaml';
import fs from 'fs';
import validator from 'is-my-json-valid';
import Mustache from 'mustache';

import logger from '../util/logger';
import Configuration from './Configuration';
import randomString from '../util/randomString';

const TEMPLATES_DIR = './templates';
const APPSERVICE_TEMPLATE = `${TEMPLATES_DIR}/appservice.yaml`;
const CONFIG_TEMPLATE = `${TEMPLATES_DIR}/gateway-config.yaml`;
const CONFIG_SCHEMA = `${TEMPLATES_DIR}/gateway-config.schema.yaml`;

// Required to prevent Mustache from HTML-escaping template values.
Mustache.escape = (text) => text;

export default class ConfigReader {
  public static loadConfig(configPath: string, appservicePath: string): Configuration | undefined {
    if (!fs.existsSync(configPath)) {
      if (!this.generateConfig(configPath)) {
        logger.error('Could not generate configuration file');
        return undefined;
      }
    }

    const config = this.readConfig(configPath);
    if (config === undefined) {
      return undefined;
    }

    let validatedConfig: Configuration;
    try {
      const validationResult = this.validateConfig(config);
      if (!validationResult) {
        return undefined;
      }
      validatedConfig = validationResult;
    } catch (error) {
      logger.error('Could not validate configuration file');
      logger.error(error.message);
      return undefined;
    }

    this.generateAppServiceConfig(validatedConfig, appservicePath);
    return validatedConfig;
  }

  private static readConfig(path: string): Record<string, unknown> | undefined {
    logger.debug(`Loading configuration file: '${path}'`);
    let rawYaml: string;
    try {
      rawYaml = fs.readFileSync(path, 'utf8');
    } catch (error) {
      logger.error('Could not read configuration file');
      logger.error(error.message);
      return undefined;
    }

    let config: string | undefined | Record<string, unknown>;
    try {
      config = YAML.safeLoad(rawYaml) as string | undefined | Record<string, unknown>;
    } catch (error) {
      logger.error('Could not parse configuration file');
      logger.error(error.message);
      return undefined;
    }
    if (config === null) {
      logger.error('Config file is empty');
      return undefined;
    }
    if (!config || typeof config === 'string') {
      logger.error('Config file is invalid');
      return undefined;
    }
    return config;
  }

  private static generateConfig(path: string): boolean {
    logger.info(`Configuration file '${path}' not found, a new one will be generated.`);
    let configTemplate: string;
    try {
      configTemplate = fs.readFileSync(CONFIG_TEMPLATE, 'utf8');
    } catch (error) {
      logger.error('Could not read configuration file template');
      logger.error(error.message);
      return false;
    }
    const view = {
      hs_token: randomString(32),
      as_token: randomString(32),
    };

    const config = Mustache.render(configTemplate, view);
    try {
      fs.writeFileSync(path, config);
    } catch (error) {
      logger.error(`Could not write generated configuration file to '${path}'`);
      logger.error(error.message);
      return false;
    }

    // We won't render this template again, so no need to cache it.
    Mustache.templateCache?.clear();
    return true;
  }

  private static validateConfig(config: Record<string, unknown>): Configuration | undefined {
    const schema = YAML.safeLoad(fs.readFileSync(CONFIG_SCHEMA, 'utf8'));
    if (typeof schema !== 'object') {
      logger.error('Could not read configuration schema');
      return undefined;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const val = validator(schema as any, {
      verbose: true,
    });
    const res = val(config, schema);
    if (!res) {
      logger.error('Configuration file validation failed');
      val.errors.forEach((error) => {
        const field = error.field.substr('data.'.length);
        if (error.message === 'must be an enum value') {
          logger.error(`The field '${field}' has an invalid value: '${error.value}'`);
        } else if (
          field === 'database.connection'
           && error.message.startsWith('no (or more than one) schemas match')
        ) {
          logger.error(`The field '${field}' has invalid properties`);
        } else if (error.message === 'has additional properties') {
          const value = (error.value as string).substr('data.'.length);
          logger.error(`Unrecognised property: '${value}'`);
        } else {
          logger.error(`The field '${field}' ${error.message}`);
        }
        logger.silly('Error value: ', error);
      });
      return undefined;
    }
    return Configuration.from(config);
  }

  private static generateAppServiceConfig(config: Configuration, path: string): void {
    logger.debug('Generating appservice.yaml');

    let appserviceTemplate: string;
    try {
      appserviceTemplate = fs.readFileSync(APPSERVICE_TEMPLATE, 'utf8');
    } catch (error) {
      logger.error('Could not read appservice template');
      logger.error(error.message);
      return;
    }

    const rendered = Mustache.render(appserviceTemplate, config);

    try {
      fs.writeFileSync(path, rendered);
    } catch (error) {
      logger.error(`Could not write generated appservice configuration to '${path}'`);
      logger.error(error.message);
    }
  }
}
