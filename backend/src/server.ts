import "dotenv/config";
import { env } from "./config/env.js";
import { connectMongo, syncMongoIndexes } from "./db/connection.js";
import { disconnectMongo } from "./db/connection.js";
import { createApp } from "./app.js";
import { ensureSeedDatabase } from "./seed.js";
import { logger } from "./lib/logger.js";
import { createOutboxRunner } from "./jobs/outbox-runner.js";
import { deliverOutboxEvent } from "./services/outbox-delivery.service.js";

async function start() {
  try {
    await connectMongo();
    await syncMongoIndexes();
    const seedResult = await ensureSeedDatabase();
    logger.info("seed_check_complete", seedResult);
  } catch (error) {
    logger.error("startup_database_init_failed", { error: error instanceof Error ? error.message : String(error) });
  }

  const app = createApp();
  const outboxRunner = createOutboxRunner(deliverOutboxEvent, {
    intervalMs: env.OUTBOX_INTERVAL_MS,
    batchSize: env.OUTBOX_BATCH_SIZE,
    maxAttempts: env.OUTBOX_MAX_ATTEMPTS,
  });
  const server = app.listen(env.PORT, () => {
    outboxRunner.start();
    logger.info("server_started", { port: env.PORT, nodeEnv: env.NODE_ENV });
  });

  async function shutdown(signal: string) {
    logger.info("server_shutdown_started", { signal });
    outboxRunner.stop();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await disconnectMongo();
  }

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
}

void start();
