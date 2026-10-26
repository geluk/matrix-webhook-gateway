import fs from 'fs';
import path from 'path';
import { createHash } from 'node:crypto';
import * as tts from 'typescript';
import { is } from 'typia';
import { transform } from 'typia/lib/transform'
import { ModuleKind, ScriptTarget } from 'typescript';

import logger from '../util/logger';
import type { ILogObj, Logger } from 'tslog';
import * as v1 from '../pluginApi/v1';
import * as v2 from '../pluginApi/v2';
import MatrixBridge from '../bridge/MatrixBridge';

const WORK_DIR = './plugins/__workdir';

export interface LoadResult {
  identifier: string,
  plugin: Plugin,
}

export type Plugin =
  | v1.WebhookPlugin
  | v2.PluginBase;

export class PluginLoader {

  public constructor(
    private cacheDirectory: string,
  ) {

  }

  public async loadPlugin(pluginPath: string, bridge: MatrixBridge | undefined): Promise<LoadResult | undefined> {
    const source = fs.readFileSync(pluginPath, 'utf8');
    const hash = createHash('sha256').update(source).digest('hex');
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

    let pluginFile;
    let pluginContainer;
    try {
      // There's no getting around using require() here, as we need to dynamically
      // load the plugin.
      pluginFile = require(importFile);
      pluginContainer = pluginFile.default;
    } catch (error) {
      logger.error('Error loading plugin: ', error);
      return undefined;
    } finally {
      fs.unlinkSync(importFile);
    }

    if (pluginContainer.prototype instanceof v2.PluginBase) {
      if (!is<{ format: string }>(pluginFile)) {
        logger.warn(`Plugin ${pluginPath} does not have a format field`);
        return undefined;
      }

      const pluginLogger = this.createLogger(pluginFile.format);

      const instance = new pluginContainer(pluginLogger, bridge);
      await instance.init();
      return {
        identifier: pluginFile.format,
        plugin: instance
      }
    }

    if (is<v1.WebhookPlugin>(pluginContainer)) {
      if (!pluginContainer.format.match(/^[a-z0-9_]+$/)) {
        logger.warn(`Invalid plugin name: ${pluginContainer.format}`);
        return undefined;
      }

      if (pluginContainer.init) {
        pluginContainer.init();
      }
      return {
        identifier: pluginContainer.format,
        plugin: pluginContainer,
      }
    }

    logger.warn(`Unknown plugin type: ${pluginPath}`);
    logger.debug('Plugin container:', pluginContainer);
    return undefined;
  }

  private createLogger(pluginName: string): Logger<ILogObj> {
    return logger.getSubLogger({
      name: `plg-${pluginName}`,
    });
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
      target: ScriptTarget.ES2022,
      module: ModuleKind.CommonJS,
    });

    const diagnostics: tts.Diagnostic[] = [];
    const extras = {
      addDiagnostic: (diagnostic: tts.Diagnostic) => {
        diagnostics.push(diagnostic);
        return diagnostics.length - 1;
      },
    };

    const emitResult = prog.emit(undefined, (_name, data) => {
      fs.writeFileSync(cachePath, data, {
        flag: 'w',
      });
    }, undefined, undefined, {
      before: [transform(prog, undefined, extras)],
    });

    const errors = [...diagnostics, ...emitResult.diagnostics]
      .filter((diagnostic) => diagnostic.category === tts.DiagnosticCategory.Error);
    for (const error of errors) {
      logger.error(tts.flattenDiagnosticMessageText(error.messageText, '\n'));
    }

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
