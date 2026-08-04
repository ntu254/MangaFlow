import { logger } from "../lib/logger.js";
import { publishDuePublications } from "../services/publication.service.js";

export function createPublicationRunner(intervalMs = 30_000) {
  let timer: ReturnType<typeof setInterval> | undefined;
  let processing = false;

  async function runOnce() {
    if (processing) return { published: 0, checked: 0 };
    processing = true;
    try {
      const result = await publishDuePublications();
      if (result.published) logger.info("publications_published", result);
      return result;
    } catch (error) {
      logger.error("publication_runner_failed", {
        message: error instanceof Error ? error.message : String(error),
      });
      return { published: 0, checked: 0 };
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
    },
    stop() {
      if (!timer) return;
      clearInterval(timer);
      timer = undefined;
    },
  };
}
