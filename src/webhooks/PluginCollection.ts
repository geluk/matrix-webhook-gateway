import fs from 'fs';
import path from 'path';
import hasha from 'hasha';
import * as tts from 'ttypescript';
import { is } from 'typescript-is';
import watch from 'node-watch';
import isTransformer from 'typescript-is/lib/transform-inline/transformer';
import logger from '../util/logger';
import * as v1 from '../pluginApi/v1';
import * as v2 from '../pluginApi/v2';
import WebhooksConfiguration from '../configuration/WebhooksConfiguration';
import MatrixBridge from '../bridge/MatrixBridge';

interface PluginBase {
  version: '1' | '2',
  format: string,
}

type Plugin =
  | v1.WebhookPlugin
  | v2.WebhookPlugin;

const WORK_DIR = './plugins/__workdir';

export default class PluginCollection {
  private plugins: Record<string, Plugin> = {};

  private loaded = false;

  private pluginDirectory: string;

  private cacheDirectory: string;

  public constructor(
    private config: WebhooksConfiguration,
    private bridge: MatrixBridge,
  ) {
    this.pluginDirectory = path.resolve(this.config.plugin_directory);
    this.cacheDirectory = path.resolve(this.config.plugin_cache_directory);
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
        await this.loadPlugin(`${file}`);
      }
    }

    const plugins = Object.keys(this.plugins);
    if (plugins.length > 0) {
      logger.info(`Loaded plugins: ${plugins.join(', ')}`);
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
        this.loadPlugin(name);
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
    return plugin.transform(body, this.createContext(type));
  }

  public async clearCache(): Promise<void> {
    for (const entry of fs.readdirSync(this.cacheDirectory)) {
      fs.rmSync(entry, {
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

  private async loadPlugin(pluginPath: string) {
    const source = fs.readFileSync(pluginPath, 'utf8');
    const hash = hasha(source, { algorithm: 'sha256' });
    const cacheFile = `${this.cacheDirectory}/${hash}.js`;

    if (!fs.existsSync(this.cacheDirectory)) {
      fs.mkdirSync(this.cacheDirectory);
    }

    if (fs.existsSync(cacheFile)) {
      logger.silly(`Cached plugin found for ${pluginPath}`);
    } else {
      logger.debug(`Compiling plugin: ${pluginPath}`);
      this.compilePlugin(source, hash, cacheFile);
    }
    logger.debug(`Loading plugin ${path.basename(pluginPath)} from ${path.basename(cacheFile)}`);

    // If this looks a bit like a hack, that's because it very much is. In order
    //  for 'typescript-is' imports to work, the source file must be in a child
    // directory of our application when we load it, so we temporarily copy
    // it there, load it, then remove it again.
    this.ensureWorkDirExists();
    const importFile = path.resolve(`${WORK_DIR}/${hash}.js`);
    fs.copyFileSync(cacheFile, importFile);

    let pluginContainer;
    try {
      // There's no getting around using require() here, as we need to dynamically
      // load the plugin.
      // eslint-disable-next-line
      pluginContainer = require(importFile).default;
    } catch (error) {
      logger.error('Error loading plugin: ', error);
      return;
    }
    fs.unlinkSync(importFile);

    if (!is<PluginBase>(pluginContainer)) {
      logger.warn(`Not a valid plugin: ${pluginPath}`);
      logger.debug('Plugin container:', pluginContainer);
      return;
    }

    if (!pluginContainer.format.match(/^[a-z0-9_]+$/)) {
      logger.warn(`Invalid plugin name: ${pluginContainer.format}`);
      return;
    }

    if (is<v1.WebhookPlugin>(pluginContainer)) {
      if (pluginContainer.init) {
        pluginContainer.init();
      }
      this.plugins[pluginContainer.format] = pluginContainer;
      return;
    }

    if (is<v2.WebhookPlugin>(pluginContainer)) {
      if (pluginContainer.init) {
        try {
          await pluginContainer.init(this.createContext(pluginContainer.format));
        } catch (error) {
          logger.error(`Plugin '${pluginContainer.format}' threw an exception during initialisation:`, error);
          return;
        }
      }
      this.plugins[pluginContainer.format] = pluginContainer;
      return;
    }

    logger.warn(`Unknown plugin type: ${pluginPath}`);
    logger.debug('Plugin container:', pluginContainer);
  }

  private createContext(pluginName: string): v2.WebhookContext {
    return {
      logger: logger.getChildLogger({
        name: `plg-${pluginName}`,
      }),
      bridge: this.bridge,
    };
  }

  private compilePlugin(source: string, hash: string, cachePath: string) {
    const sourcePath = `${WORK_DIR}/${hash}.ts`;

    // Just as before, we need to place the file somewhere in a child directory
    // of our application before we compile it, otherwise  `typescript-is`
    // won't desugar any of its is<T>() calls in the plugin file.
    this.ensureWorkDirExists();
    fs.writeFileSync(sourcePath, source);
    const prog = tts.createProgram([sourcePath], {
      strictNullChecks: true,
    });

    prog.emit(undefined, (_name, data) => {
      fs.writeFileSync(cachePath, data, {
        flag: 'w',
      });
    }, undefined, undefined, {
      before: [isTransformer(prog, {
        functionBehavior: 'ignore',
      })],
    });

    fs.unlinkSync(sourcePath);
  }

  private ensureWorkDirExists() {
    if (!fs.existsSync(WORK_DIR)) {
      fs.mkdirSync(WORK_DIR, {
        recursive: true,
      });
    }
  }
}
