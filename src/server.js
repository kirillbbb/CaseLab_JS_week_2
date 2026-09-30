import { createApp } from "./app.js";
import { loadConfig } from "./config/env.js";
import { assertDatabaseConnection } from "./db/health.js";
import { sequelize } from "./db/sequelize.js";
import { createLogger } from "./logger/index.js";

const config = loadConfig();
const logger = createLogger(config);

try {
  await assertDatabaseConnection();
  const app = createApp(config, { logger });
  const server = app.listen(config.port, () => logger.info({ port: config.port }, "server started"));

  const shutdown = async (signal) => {
    logger.info({ signal }, "shutting down");
    server.close(async () => {
      await sequelize.close();
      process.exit(0);
    });
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
} catch (error) {
  logger.error({ error }, "database connection failed during startup");
  await sequelize.close();
  process.exit(1);
}