import fs from 'fs';
import path from 'path';
import watch from 'node-watch';

import logger from '../util/logger';
import * as v1 from '../pluginApi/v1';
import * as v2 from '../pluginApi/v2';
import WebhooksConfiguration from '../configuration/WebhooksConfiguration';
import MatrixBridge from '../bridge/MatrixBridge';
import { Plugin, PluginLoader } from './PluginLoader';

export default class PluginCollection {
  private plugins: Record<string, Plugin> = {};

  private loader: PluginLoader;

  private loaded = false;

  private pluginDirectory: string;

  private cacheDirectory: string;

  public constructor(
    private config: WebhooksConfiguration,
    private bridge: MatrixBridge | undefined,
  ) {
    this.pluginDirectory = path.resolve(this.config.plugin_directory);
    this.cacheDirectory = path.resolve(this.config.plugin_cache_directory);
    this.loader = new PluginLoader(this.config.plugin_cache_directory);
  }

  public async load(): Promise<void> {
    if (this.loaded) {
      return;
    }
    if (!fs.existsSync(this.pluginDirectory)) {
      logger.warn(`Plugin directory '${this.pluginDirectory}' does not exist. `
        + 'No plugins will be loaded.');
      return;
    }

    for await (const file of this.walk(this.pluginDirectory)) {
      if (file.endsWith('.ts')) {
        const loadResult = await this.loader.loadPlugin(file, this.bridge);
        if (loadResult) {
          this.plugins[loadResult.identifier] = loadResult.plugin;
        }
      }
    }

    const plugins = Object.keys(this.plugins);
    if (plugins.length > 0) {
      logger.info(`Loaded plugins: ${plugins.sort().join(', ')}`);
    } else {
      logger.info('No plugins were loaded');
    }

    watch(this.pluginDirectory, {
      recursive: true,
      delay: 1000,
      persistent: false,
      filter: (f) => f.endsWith('.ts'),
    }, async (evt, name) => {
      if (evt === 'update' && name) {
        logger.info(`Plugin ${name} was updated, reloading`);
        const loadResult = await this.loader.loadPlugin(name, this.bridge);
        if (loadResult) {
          this.plugins[loadResult.identifier] = loadResult.plugin;
        }
      }
    });

    this.loaded = true;
  }

  public acceptsType(type: string): boolean {
    return !!this.plugins[type];
  }

  public async apply(body: unknown, type: string):
    Promise<v1.WebhookMessage | v2.WebhookMessage | undefined> {
    const plugin = this.plugins[type];
    return plugin.transform(body);
  }

  public async clearCache(): Promise<void> {
    for (const entry of fs.readdirSync(this.cacheDirectory)) {
      fs.rmSync(`${this.cacheDirectory}/${entry}`, {
        recursive: true,
      });
    }
  }

  private async* walk(dir: string): AsyncIterable<string> {
    for await (const d of await fs.promises.opendir(dir)) {
      const entry = path.join(dir, d.name);
      if (d.isDirectory()) {
        if (entry === this.cacheDirectory) {
          logger.silly('Plugin discovery - skipping cache directory: ', entry);
        } else if (d.name === '__workdir') {
          logger.silly('Plugin discovery - skipping working directory: ', entry);
        } else {
          yield* this.walk(entry);
        }
      } else if (d.isFile()) {
        yield entry;
      }
    }
  }


}
