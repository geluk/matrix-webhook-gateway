import fs from 'fs';
import path from 'path';
import hasha from 'hasha';
import * as tts from 'ttypescript';
import { is } from 'typescript-is';
import isTransformer from 'typescript-is/lib/transform-inline/transformer';

import logger from '../util/logger';
import { WebhookMessage } from './formats';

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

export default class PluginCollection {
  private plugins: Record<string, WebhookPlugin> = {};

  private loaded = false;

  private cacheDirectory: string;

  public constructor(
    private pluginDirectory: string,
  ) {
    this.cacheDirectory = path.resolve(`${this.pluginDirectory}/__cache`);
  }

  public load(): void {
    if (this.loaded) {
      return;
    }
    fs.readdirSync(this.pluginDirectory).forEach((file) => {
      if (file.endsWith('.ts')) {
        this.loadPlugin(`${this.pluginDirectory}/${file}`);
      }
    });
    logger.info(`Loaded plugins: ${Object.keys(this.plugins)}`);
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
      this.compilePlugin(pluginPath, cacheFile);
    }
    const requirePath = `${cacheFile}`;

    logger.debug(`Loading plugin from ${requirePath}`);

    // eslint-disable-next-line
    const pluginContainer = require(requirePath).default;

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

  private compilePlugin(pluginPath: string, cachePath: string) {
    logger.debug(`Compiling plugin: ${pluginPath}`);
    const prog = tts.createProgram([pluginPath], {});
    prog.emit(undefined, (_name, data) => {
      fs.writeFileSync(cachePath, data, {
        flag: 'w',
      });
    }, undefined, undefined, {
      before: [isTransformer(prog)],
    });
  }
}
