/**
 * Remove the retired per-notification archive state.
 *
 * Dry-run is the default. Legacy archived notifications are deleted to preserve
 * the old user's explicit hide choice; active records only have the old field
 * removed.
 *
 *   npm run migrate:notification-read-model
 *   npm run migrate:notification-read-model:apply
 */

import "dotenv/config";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import {
  planNotificationReadModelMigration,
  type LegacyNotificationRecord,
} from "../services/notification-read-model-migration.service.js";

export type NotificationReadModelMigrationSummary = {
  removeIds: string[];
  cleanIds: string[];
};

export function summarizeNotificationReadModelMigration(
  records: LegacyNotificationRecord[],
): NotificationReadModelMigrationSummary {
  const summary: NotificationReadModelMigrationSummary = { removeIds: [], cleanIds: [] };
  for (const record of records) {
    const plan = planNotificationReadModelMigration(record);
    if (plan.action === "REMOVE_LEGACY_ARCHIVED") summary.removeIds.push(record.id);
    if (plan.action === "CLEAN_LEGACY_FIELD") summary.cleanIds.push(record.id);
  }
  return summary;
}

const apply = process.argv.includes("--apply");
const explicitDryRun = process.argv.includes("--dry-run");
if (apply && explicitDryRun) throw new Error("--apply and --dry-run are mutually exclusive.");
const mongoUri =
  process.env.MONGO_URI ?? process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/mangaflow";

async function main() {
  await mongoose.connect(mongoUri);
  const notifications = mongoose.connection.db!.collection<LegacyNotificationRecord>("notifications");
  const records = (await notifications
    .find({ archivedAt: { $exists: true } })
    .project({ id: 1, archivedAt: 1 })
    .toArray()) as unknown as LegacyNotificationRecord[];
  const summary = summarizeNotificationReadModelMigration(records);

  console.log(`Notification migration: ${records.length} legacy record(s) inspected.`);
  console.log(
    `Remove archived: ${summary.removeIds.length}; clean active legacy field: ${summary.cleanIds.length}.`,
  );
  summary.removeIds.forEach((id) => console.log(`  REMOVE ${id}`));
  summary.cleanIds.forEach((id) => console.log(`  CLEAN ${id}`));

  if (!apply) {
    console.log("Dry run: no documents changed. Re-run with the :apply script to persist.");
    return;
  }

  for (const id of summary.removeIds) await notifications.deleteOne({ id });
  for (const id of summary.cleanIds) {
    await notifications.updateOne({ id }, { $unset: { archivedAt: "" } });
  }
  console.log("Migration complete. A second run should report zero legacy records.");
}

if (process.argv[1] && resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1])) {
  try {
    await main();
  } finally {
    await mongoose.disconnect();
  }
}
