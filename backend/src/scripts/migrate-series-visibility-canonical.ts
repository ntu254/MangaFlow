/**
 * Remove the redundant ARCHIVED Series visibility.
 *
 * Series archival is represented by status=ARCHIVED. Archived Series remain
 * hidden from readers through visibility=UNLISTED.
 *
 * Usage:
 *   tsx src/scripts/migrate-series-visibility-canonical.ts
 *   tsx src/scripts/migrate-series-visibility-canonical.ts --apply
 */
import "dotenv/config";
import mongoose from "mongoose";

const apply = process.argv.includes("--apply");
const mongoUri =
  process.env.MONGODB_URI ??
  process.env.MONGO_URI ??
  "mongodb://127.0.0.1:27017/mangaflow";

async function main() {
  await mongoose.connect(mongoUri);
  const series = mongoose.connection.db!.collection("series");
  const filter = { visibility: "ARCHIVED" };
  const count = await series.countDocuments(filter);

  console.log(`Found ${count} Series row(s) with legacy ARCHIVED visibility.`);
  if (!apply) {
    console.log("Dry run only. Re-run with --apply to write changes.");
    await mongoose.disconnect();
    return;
  }

  const result = await series.updateMany(filter, {
    $set: { visibility: "UNLISTED", updatedAt: new Date() },
  });
  console.log(`Applied ${result.modifiedCount} update(s).`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
