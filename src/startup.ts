import MatrixBridge from "./bridge/MatrixBridge";
import Configuration from "./configuration/Configuration";
import CachedImageFromDatabase from "./repositories/CachedImageRepository";
import Database from "./repositories/Database";
import HookCallRepository from "./repositories/HookCallRepository";
import UserRepository from "./repositories/UserRepository";
import WebhookRepository from "./repositories/WebhookRepository";
import logger, { logExt } from "./util/logger";
import Matcher from "./webhooks/Matcher";
import PluginCollection from "./webhooks/PluginCollection";
import WebhookListener from "./webhooks/WebhookListener";
import WebhookService from "./WebhookService";

export default async function startup(clearPluginCache: boolean, autoMigrate: boolean, config: Configuration): Promise<void> {
    const database = new Database(config.database);

    try {
        await database.assertConnected();
    } catch (error) {
        logger.fatal('Unable to connect to the database: ', error);
        process.exit(1);
    }

    if (autoMigrate) {
        await database.migrate();
    } else {
        const migrations = await database.getMigrationStatus();
        if (migrations.pending.length > 0) {
            logger.fatal(
                'Application failed to start: there are pending migrations, and --no-auto-migrate was specified',
            );
            process.exit(1);
        }
    }

    const imageRepository = new CachedImageFromDatabase(database);
    const userRepository = new UserRepository(database);
    const webhookRepository = new WebhookRepository(database);
    const hookCallRepository = new HookCallRepository(database);

    const bridge = new MatrixBridge(
        config.app_service,
        imageRepository,
        userRepository,
    );
    const plugins = new PluginCollection(config.webhooks, bridge);
    const matcher = new Matcher(webhookRepository, plugins);
    const webhookListener = new WebhookListener(
        config.webhooks,
        matcher,
        hookCallRepository,
    );
    const webhookService = new WebhookService(
        bridge,
        webhookRepository,
        webhookListener.onWebhookResult,
        config,
    );
    try {
        if (clearPluginCache) {
            plugins.clearCache();
        }
        await webhookService.start();
        await webhookListener.start();
    } catch (error) {
        logExt.prettyError(error);
        logger.fatal('Could not start webhook-gateway');
        process.exit(1);
    }
};