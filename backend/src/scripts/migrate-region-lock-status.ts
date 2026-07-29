/**
 * Canonicalize StudioRegion lock state.
 *
 * Dry-run by default; pass --apply to persist the idempotent migration.
 *
 * Usage:
 *   npm run migrate:region-lock-status
 *   npm run migrate:region-lock-status -- --apply
 */

import "dotenv/config";
import mongoose from "mongoose";
import { planRegionLockMigration } from "../services/region-lock-migration.service.js";

const apply = process.argv.includes("--apply");
const explicitDryRun = process.argv.includes("--dry-run");
if (apply && explicitDryRun) {
  throw new Error("--apply and --dry-run are mutually exclusive.");
}
const mongoUri =
  process.env.MONGO_URI ?? process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/mangaflow";

async function main() {
  await mongoose.connect(mongoUri);
  const regions = mongoose.connection.db!.collection("studioregions");
  const records = await regions
    .find({ lockStatus: "RELEASED" })
    .project({ id: 1, lockStatus: 1 })
    .toArray();
  const plans = records.map((record) => ({
    record,
    plan: planRegionLockMigration(record),
  }));
  const matches = plans.filter(({ plan }) => plan.action === "MIGRATE").length;

  if (!apply) {
    console.log(`Dry run: ${matches} StudioRegion document(s) would be migrated.`);
    return;
  }

  let migrated = 0;
  for (const { record, plan } of plans) {
    if (plan.action !== "MIGRATE") continue;
    const filter = record.id ? { id: record.id } : { _id: record._id };
    const result = await regions.updateOne(filter, { $set: plan.set });
    migrated += result.modifiedCount;
  }
  console.log(`Migrated ${migrated} StudioRegion document(s) to UNLOCKED.`);
}

try {
  await main();
} finally {
  await mongoose.disconnect();
}
