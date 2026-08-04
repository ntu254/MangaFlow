import "dotenv/config";
import { env } from "./config/env.js";
import { connectMongo } from "./db/connection.js";
import { disconnectMongo } from "./db/connection.js";
import { createApp } from "./app.js";
import { ensureSeedDatabase } from "./seed.js";
import { logger } from "./lib/logger.js";
import { createOutboxRunner } from "./jobs/outbox-runner.js";
import { deliverOutboxEvent } from "./services/outbox-delivery.service.js";
import { createPublicationRunner } from "./jobs/publication-runner.js";

async function start() {
  try {
    await connectMongo();
    const seedResult = await ensureSeedDatabase();
    logger.info("seed_check_complete", seedResult);
  } catch (error) {
    logger.error("startup_database_init_failed", { error: error instanceof Error ? error.message : String(error) });
    if (!env.STARTUP_ALLOW_DEGRADED) {
      process.exitCode = 1;
      throw error;
    }
    logger.warn("startup_continuing_degraded", { readiness: "503 until database is reachable" });
  }

  const app = createApp();
  const outboxRunner = createOutboxRunner(deliverOutboxEvent, {
    intervalMs: env.OUTBOX_INTERVAL_MS,
    batchSize: env.OUTBOX_BATCH_SIZE,
    maxAttempts: env.OUTBOX_MAX_ATTEMPTS,
  });
  const publicationRunner = createPublicationRunner(env.PUBLICATION_INTERVAL_MS);
  const server = app.listen(env.PORT, () => {
    outboxRunner.start();
    publicationRunner.start();
    logger.info("server_started", { port: env.PORT, nodeEnv: env.NODE_ENV });
  });

  async function shutdown(signal: string) {
    logger.info("server_shutdown_started", { signal });
    outboxRunner.stop();
    publicationRunner.stop();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await disconnectMongo();
  }

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
}

void start();
