import mongoose from "mongoose";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
// Imported for its side effect: every model must be registered before
// syncMongoIndexes() can reconcile it against the database.
import "./models.js";

export async function connectMongo(uri = env.MONGO_URI) {
  if (!uri) {
    throw new Error("MONGO_URI is required to start the backend outside tests.");
  }

  if (mongoose.connection.readyState === 1) {
    return;
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, {
    autoIndex: true,
    serverSelectionTimeoutMS: 5_000,
  });
}

/**
 * Reconcile every registered model's indexes with the database.
 *
 * `autoIndex` only ever *creates* missing indexes — it never drops or alters
 * one that already exists. A schema change such as removing `unique` therefore
 * leaves the old index in place, and writes keep failing with E11000 long after
 * the code says they should be allowed. `syncIndexes()` drops those leftovers.
 *
 * Never fatal: a failure here degrades index hygiene, not availability.
 */
export async function syncMongoIndexes() {
  const dropped: Record<string, string[]> = {};
  for (const [name, model] of Object.entries(mongoose.models)) {
    try {
      const removed = await model.syncIndexes();
      if (removed.length > 0) dropped[name] = removed;
    } catch (error) {
      logger.warn("index_sync_failed", {
        model: name,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  if (Object.keys(dropped).length > 0) {
    logger.info("index_sync_dropped_stale", dropped);
  }
  return dropped;
}

export async function disconnectMongo() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
