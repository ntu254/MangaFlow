import mongoose from "mongoose";
import * as dotenv from "dotenv";

dotenv.config({ path: "backend/.env" });

const mongoUri =
  process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/mangaflow";
const dryRun = process.argv.includes("--dry-run");

const TERMINAL_TASK_STATUSES = ["REJECTED", "CANCELLED"];

const REGION_STATUS_BY_TASK_STATUS: Record<string, string> = {
  TODO: "ASSIGNED",
  IN_PROGRESS: "IN_PROGRESS",
  SUBMITTED: "SUBMITTED",
  REVISION_REQUESTED: "REVISION_REQUIRED",
  MANGAKA_REVIEWING: "SUBMITTED",
  MANGAKA_REVISION_REQUESTED: "REVISION_REQUIRED",
  MANGAKA_APPROVED: "APPROVED",
  EDITOR_REVIEWING: "APPROVED",
  EDITOR_REVISION_REQUESTED: "REVISION_REQUIRED",
  EDITOR_APPROVED: "APPROVED",
};

/**
 * region.taskId/region.status were never written by the backend before this
 * change — createTask never touched the region it targeted, and no lifecycle
 * transition wrote region.status at all. This backfill re-derives both fields
 * from each region's most recent non-terminal StudioTask, for data created
 * before the fix landed. Regions with no matching active task are left alone
 * (don't clobber DETECTED/CONFIRMED/DISCARDED).
 */
async function run() {
  console.log(`${dryRun ? "[dry-run] " : ""}Backfilling region.taskId/region.status from studiotasks`);
  await mongoose.connect(mongoUri);
  try {
    const tasks = mongoose.connection.db!.collection("studiotasks");
    const regions = mongoose.connection.db!.collection("studioregions");

    const activeTasks = await tasks
      .find(
        { status: { $nin: TERMINAL_TASK_STATUSES }, regionId: { $exists: true, $ne: null } },
        { projection: { id: 1, regionId: 1, status: 1, updatedAt: 1 } },
      )
      .toArray();

    // If a region somehow has more than one non-terminal task (shouldn't happen
    // going forward now that createTask guards against it), prefer the most
    // recently updated one.
    const latestByRegion = new Map<string, (typeof activeTasks)[number]>();
    for (const task of activeTasks) {
      const regionId = String(task.regionId);
      const existing = latestByRegion.get(regionId);
      if (!existing || new Date(task.updatedAt) > new Date(existing.updatedAt)) {
        latestByRegion.set(regionId, task);
      }
    }

    let updated = 0;
    let skipped = 0;
    for (const [regionId, task] of latestByRegion) {
      const region = await regions.findOne({ id: regionId }, { projection: { taskId: 1, status: 1 } });
      if (!region) {
        skipped += 1;
        continue;
      }
      const nextStatus = REGION_STATUS_BY_TASK_STATUS[String(task.status)] ?? "ASSIGNED";
      const needsUpdate = region.taskId !== task.id || region.status !== nextStatus;
      if (!needsUpdate) {
        skipped += 1;
        continue;
      }
      console.log(
        `  region ${regionId}: taskId ${region.taskId ?? "—"} -> ${task.id}, status ${region.status ?? "—"} -> ${nextStatus}`,
      );
      if (!dryRun) {
        await regions.updateOne(
          { id: regionId },
          { $set: { taskId: task.id, status: nextStatus, updatedAt: new Date().toISOString() } },
        );
      }
      updated += 1;
    }

    console.log(
      `regions: activeTasks=${latestByRegion.size}, ${dryRun ? "wouldUpdate" : "updated"}=${updated}, unchanged=${skipped}`,
    );
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
