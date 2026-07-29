/**
 * Canonicalize StudioComment legacy fields and statuses.
 *
 * Dry-run by default; pass --apply to persist the idempotent migration.
 *
 * Migration rules:
 *   - blocking:true      -> isBlocking:true, then remove blocking
 *   - blocking:false     -> remove blocking (isBlocking already defaults false)
 *   - FIXED              -> ADDRESSED (the canonical non-blocking intermediate state)
 *
 * Usage:
 *   npm run migrate:canonical-comments
 *   npm run migrate:canonical-comments -- --apply
 */

import "dotenv/config";
import mongoose from "mongoose";
import { planCanonicalCommentMigration } from "../services/canonical-comment-migration.service.js";

const apply = process.argv.includes("--apply");
const explicitDryRun = process.argv.includes("--dry-run");
if (apply && explicitDryRun) {
  throw new Error("--apply and --dry-run are mutually exclusive.");
}
const mongoUri =
  process.env.MONGO_URI ?? process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/mangaflow";

async function main() {
  await mongoose.connect(mongoUri);
  const comments = mongoose.connection.db!.collection("studiocomments");

  const records = await comments
    .find({ $or: [{ blocking: { $exists: true } }, { status: "FIXED" }] })
    .project({ id: 1, blocking: 1, isBlocking: 1, status: 1 })
    .toArray();
  const plans = records.map((record) => ({
    record,
    plan: planCanonicalCommentMigration(record),
  }));
  const legacyBlockingCount = records.filter((record) => "blocking" in record).length;
  const legacyFixedCount = records.filter((record) => record.status === "FIXED").length;

  console.log(
    `Found ${legacyBlockingCount} comment(s) with legacy blocking and ${legacyFixedCount} with legacy FIXED status.`,
  );

  if (!apply) {
    console.log("Dry run: no documents changed. Re-run with --apply to persist the migration.");
    return;
  }

  let migrated = 0;
  for (const { record, plan } of plans) {
    if (plan.action !== "MIGRATE") continue;
    const filter = record.id ? { id: record.id } : { _id: record._id };
    const result = await comments.updateOne(filter, {
      ...(Object.keys(plan.set).length > 0 ? { $set: plan.set } : {}),
      ...(Object.keys(plan.unset).length > 0 ? { $unset: plan.unset } : {}),
    });
    migrated += result.modifiedCount;
  }

  console.log(`Migrated ${migrated} comment document(s) to canonical fields.`);
}

try {
  await main();
} finally {
  await mongoose.disconnect();
}
