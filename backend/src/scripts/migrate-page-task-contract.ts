/**
 * Backfill the page-level task contract.
 *
 * Dry-run by default; pass --apply to persist changes. Conflicting pages with
 * more than one active legacy task are reported and left untouched so an
 * operator can resolve the work explicitly before the unique index is used.
 */
import "dotenv/config";
import mongoose from "mongoose";

const apply = process.argv.includes("--apply");
const mongoUri =
  process.env.MONGO_URI ??
  process.env.MONGODB_URI ??
  "mongodb://127.0.0.1:27017/mangaflow";
const terminalStatuses = new Set([
  "REJECTED",
  "CANCELLED",
  "MANGAKA_APPROVED",
  "EDITOR_APPROVED",
  "COMPLETED",
]);

function isActive(task: any) {
  return task.pageTaskActive === true ||
    (task.pageTaskActive == null && !terminalStatuses.has(String(task.status)));
}

async function main() {
  await mongoose.connect(mongoUri);
  const tasks = mongoose.connection.db!.collection("studiotasks");
  const rows = await tasks
    .find(
      { pageId: { $type: "string", $ne: "" } },
      { projection: { id: 1, pageId: 1, regionId: 1, status: 1, pageTaskActive: 1, targetScope: 1 } },
    )
    .sort({ updatedAt: -1, id: 1 })
    .toArray();
  const byPage = new Map<string, any[]>();
  for (const task of rows) {
    const pageId = String(task.pageId);
    const list = byPage.get(pageId) ?? [];
    list.push(task);
    byPage.set(pageId, list);
  }

  let converted = 0;
  let terminalized = 0;
  const conflicts: string[] = [];
  for (const [pageId, pageTasks] of byPage) {
    const active = pageTasks.filter(isActive);
    if (active.length > 1) {
      conflicts.push(`${pageId}: ${active.map((task) => task.id).join(", ")}`);
      continue;
    }
    for (const task of pageTasks) {
      const isPageTask = !task.regionId;
      const patch: Record<string, unknown> = {
        targetScope: isPageTask ? "PAGE" : "REGION",
      };
      if (isPageTask && active.length === 1 && String(active[0].id) === String(task.id)) {
        patch.pageTaskActive = true;
        converted += 1;
      } else if (isPageTask && terminalStatuses.has(String(task.status))) {
        patch.pageTaskActive = false;
        terminalized += 1;
      }
      if (!apply) continue;
      await tasks.updateOne({ _id: task._id }, { $set: patch });
    }
  }

  console.log(
    `${apply ? "Applied" : "Dry run"}: ${converted} active page task(s), ${terminalized} terminal page task(s), ${conflicts.length} conflict page(s).`,
  );
  if (conflicts.length) {
    console.log("Resolve these pages before enabling the unique active-page index:");
    for (const conflict of conflicts) console.log(`  ${conflict}`);
  }
}

try {
  await main();
} finally {
  await mongoose.disconnect();
}
