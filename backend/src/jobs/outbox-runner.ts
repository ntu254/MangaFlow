import { processOutboxBatch, type OutboxDeliveryHandler } from "../services/outbox.service.js";
import { logger } from "../lib/logger.js";

export type OutboxRunnerOptions = {
  intervalMs?: number;
  batchSize?: number;
  maxAttempts?: number;
};

export function createOutboxRunner(
  handler: OutboxDeliveryHandler,
  options: OutboxRunnerOptions = {},
) {
  const intervalMs = options.intervalMs ?? 5_000;
  let timer: ReturnType<typeof setInterval> | undefined;
  let processing = false;

  async function runOnce() {
    if (processing) return { sent: 0, failed: 0, deadLettered: 0, skipped: 0 };
    processing = true;
    try {
      const result = await processOutboxBatch(handler, {
        batchSize: options.batchSize,
        maxAttempts: options.maxAttempts,
      });
      if (result.sent || result.failed || result.deadLettered) {
        logger.info("outbox_batch_processed", result);
      }
      return result;
    } catch (error) {
      logger.error("outbox_batch_failed", {
        message: error instanceof Error ? error.message : String(error),
      });
      return { sent: 0, failed: 0, deadLettered: 0, skipped: 0 };
    } finally {
      processing = false;
    }
  }

  return {
    runOnce,
    start() {
      if (timer) return;
      void runOnce();
      timer = setInterval(() => void runOnce(), intervalMs);
      timer.unref?.();
      logger.info("outbox_runner_started", { intervalMs });
    },
    stop() {
      if (!timer) return;
      clearInterval(timer);
      timer = undefined;
      logger.info("outbox_runner_stopped");
    },
  };
}
