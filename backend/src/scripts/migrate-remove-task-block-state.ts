/**
 * Remove the retired StudioTask block/unblock fields.
 *
 * The task status remains unchanged. A legacy task that was marked blocked
 * therefore continues from its canonical status (usually TODO) and follows
 * the normal assignment/start/submit flow.
 *
 * Dry-run by default; pass --apply to persist the idempotent migration.
 */

import "dotenv/config";
import mongoose from "mongoose";

const apply = process.argv.includes("--apply");
const mongoUri =
  process.env.MONGO_URI ?? process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/mangaflow";

async function main() {
  await mongoose.connect(mongoUri);
  const tasks = mongoose.connection.db!.collection("studiotasks");
  const filter = {
    $or: [
      { blocked: { $exists: true } },
      { blockedReason: { $exists: true } },
      { blockedBy: { $exists: true } },
    ],
  };
  const count = await tasks.countDocuments(filter);
  console.log(`Found ${count} StudioTask document(s) with retired block fields.`);

  if (!apply) {
    console.log("Dry run: no documents changed. Re-run with --apply to persist the migration.");
    return;
  }

  const result = await tasks.updateMany(filter, {
    $unset: { blocked: "", blockedReason: "", blockedBy: "" },
  });
  console.log(`Removed retired task block fields from ${result.modifiedCount} document(s).`);
}

try {
  await main();
} finally {
  await mongoose.disconnect();
}
