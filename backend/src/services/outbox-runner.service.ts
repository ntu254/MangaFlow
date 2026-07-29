import { logger } from "../lib/logger.js";
import { processOutboxBatch } from "./outbox.service.js";

export function startOutboxRunner(intervalMs = 10_000): () => void {
  let running = false;
  let stopped = false;

  const run = async () => {
    if (running || stopped) return;
    running = true;
    try {
      await processOutboxBatch(async (event) => {
        logger.info("outbox.delivered", {
          id: event.id,
          type: event.type,
          aggregateType: event.aggregateType,
          aggregateId: event.aggregateId,
        });
      });
    } catch (error) {
      logger.error("outbox.batch_failed", { error: error instanceof Error ? error.message : String(error) });
    } finally {
      running = false;
    }
  };

  void run();
  const timer = setInterval(() => void run(), intervalMs);
  return () => {
    if (stopped) return;
    stopped = true;
    clearInterval(timer);
  };
}
