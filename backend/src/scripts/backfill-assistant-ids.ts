import mongoose from "mongoose";
import * as dotenv from "dotenv";

dotenv.config({ path: "backend/.env" });

const mongoUri =
  process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/mangaflow";
const dryRun = process.argv.includes("--dry-run");

/**
 * `series.assistantIds` is a denormalized cache that drives studio access (getStudioPermissions +
 * studio-access.service). It was never synced from the `seriesmembers` collection, so invited
 * assistants got "no access". This backfill (a) normalizes member status "ACTIVE" -> "active"
 * (a prior casing bug), and (b) rebuilds series.assistantIds from active assistant members.
 */
async function run() {
  console.log(`${dryRun ? "[dry-run] " : ""}Backfilling series.assistantIds from seriesmembers`);
  await mongoose.connect(mongoUri);
  try {
    const members = mongoose.connection.db!.collection("seriesmembers");
    const series = mongoose.connection.db!.collection("series");

    // (a) normalize status casing
    const badStatus = await members.countDocuments({ status: "ACTIVE" });
    if (!dryRun && badStatus > 0) {
      await members.updateMany({ status: "ACTIVE" }, { $set: { status: "active" } });
    }
    console.log(`members: status "ACTIVE"->"active" ${dryRun ? "would fix" : "fixed"}=${badStatus}`);

    // (b) rebuild assistantIds per series
    const assistantMembers = await members
      .find({ role: "assistant", status: "active" }, { projection: { seriesId: 1, userId: 1 } })
      .toArray();

    const bySeries = new Map<string, Set<string>>();
    for (const m of assistantMembers) {
      const sid = String(m.seriesId);
      if (!bySeries.has(sid)) bySeries.set(sid, new Set());
      bySeries.get(sid)!.add(String(m.userId));
    }

    let updated = 0;
    for (const [seriesId, ids] of bySeries) {
      const arr = [...ids];
      if (!dryRun) {
        await series.updateOne(
          { id: seriesId },
          { $set: { assistantIds: arr, updatedAt: new Date().toISOString() } },
        );
      }
      updated += 1;
      console.log(`  series ${seriesId}: assistantIds=[${arr.join(", ")}]`);
    }
    console.log(`series: ${dryRun ? "wouldUpdate" : "updated"}=${updated}`);
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
