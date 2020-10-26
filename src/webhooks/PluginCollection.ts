import fs from 'fs';
import path from 'path';
import hasha from 'hasha';
import * as tts from 'ttypescript';
import { is } from 'typescript-is';
import isTransformer from 'typescript-is/lib/transform-inline/transformer';

import logger from '../util/logger';
import { WebhookMessage } from './formats';
import WebhooksConfiguration from '../configuration/WebhooksConfiguration';

interface WebhookPlugin {
  version: '1',
  format: string,
  init?: () => void,
  transform: (body: unknown) => WebhookMessage | undefined,
  sourceHash: string,
}

interface EvaluatedPlugin {
  version: '1',
  format: string,
  init?: unknown,
  transform: unknown,
}

const WORK_DIR = './plugins/__workdir';

export default class PluginCollection {
  private plugins: Record<string, WebhookPlugin> = {};

  private loaded = false;

  private pluginDirectory: string;

  private cacheDirectory: string;

  public constructor(
    private config: WebhooksConfiguration,
  ) {
    this.pluginDirectory = path.resolve(this.config.plugin_directory);
    this.cacheDirectory = path.resolve(this.config.plugin_cache_directory);
  }

  public load(): void {
    if (this.loaded) {
      return;
    }
    if (!fs.existsSync(this.pluginDirectory)) {
      logger.warn(`Plugin directory '${this.pluginDirectory}' does not exist. `
      + 'No plugins will be loaded.');
      return;
    }
    fs.readdirSync(this.pluginDirectory).forEach((file) => {
      if (file.endsWith('.ts')) {
        this.loadPlugin(`${this.pluginDirectory}/${file}`);
      }
    });
    const plugins = Object.keys(this.plugins);
    if (plugins.length > 0) {
      logger.info(`Loaded plugins: ${plugins.join(', ')}`);
    } else {
      logger.info('No plugins were loaded');
    }
    this.loaded = true;
  }

  public acceptsType(type: string): boolean {
    return !!this.plugins[type];
  }

  public apply(body: unknown, type: string): WebhookMessage | undefined {
    const plugin = this.plugins[type];
    return plugin.transform(body);
  }

  private loadPlugin(pluginPath: string): string | undefined {
    const source = fs.readFileSync(pluginPath, 'utf8');
    const hash = hasha(source, { algorithm: 'sha256' });
    const cacheFile = `${this.cacheDirectory}/${hash}.js`;

    if (!fs.existsSync(this.cacheDirectory)) {
      fs.mkdirSync(this.cacheDirectory);
    }

    if (!fs.existsSync(cacheFile)) {
      logger.debug(`Compiling plugin: ${pluginPath}`);
      this.compilePlugin(source, hash, cacheFile);
    }
    logger.debug(`Loading plugin from ${cacheFile}`);

    // If this looks a bit like a hack, that's because it very much is. In order
    //  for 'typescript-is' imports to work, the source file must be in a child
    // directory of our application when we load it, so we temporarily copy
    // it there, load it, then remove it again.
    this.ensureWorkDirExists();
    const importFile = path.resolve(`${WORK_DIR}/${hash}.js`);
    fs.copyFileSync(cacheFile, importFile);

    // There's no getting around using require() here, as we need to dynamically
    // load the plugin.
    // eslint-disable-next-line
    const pluginContainer = require(importFile).default;
    fs.unlinkSync(importFile);

    if (is<EvaluatedPlugin>(pluginContainer)) {
      if (pluginContainer.format.match(/[a-z0-9]+/)) {
        this.plugins[pluginContainer.format] = pluginContainer as WebhookPlugin;
        return pluginContainer.format;
      }
      logger.warn(`Invalid plugin identifier: '${pluginContainer.format}'`);
    }
    logger.warn(`Not a valid plugin: ${pluginPath}`);
    logger.debug('Plugin container:', pluginContainer);
    return undefined;
  }

  private compilePlugin(source: string, hash: string, cachePath: string) {
    const sourcePath = `${WORK_DIR}/${hash}.ts`;

    // Just as before, we need to place the file somewhere in a child directory
    // of our application before we compile it, otherwise  `typescript-is`
    // won't desugar any of its is<T>() calls in the plugin file.
    this.ensureWorkDirExists();
    fs.writeFileSync(sourcePath, source);
    const prog = tts.createProgram([sourcePath], {});

    prog.emit(undefined, (_name, data) => {
      fs.writeFileSync(cachePath, data, {
        flag: 'w',
      });
    }, undefined, undefined, {
      before: [isTransformer(prog)],
    });

    fs.unlinkSync(sourcePath);
  }

  private ensureWorkDirExists() {
    if (!fs.existsSync(WORK_DIR)) {
      fs.mkdirSync(WORK_DIR);
    }
  }
}
