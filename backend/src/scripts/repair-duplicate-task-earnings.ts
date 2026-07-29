/**
 * Retain the earliest earning for each task and reverse duplicates.
 *
 * Usage:
 *   tsx src/scripts/repair-duplicate-task-earnings.ts
 *   tsx src/scripts/repair-duplicate-task-earnings.ts --apply
 */
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

export async function repairDuplicateTaskEarnings(
  apply: boolean,
): Promise<{ retained: number; reversed: number }> {
  const earnings = await mongoose.connection.collection("earnings").find({
    taskId: { $exists: true, $nin: [null, ""] },
  })
    .sort({ taskId: 1, createdAt: 1, id: 1 })
    .toArray();
  const retained = new Map<string, any>();
  let reversed = 0;

  for (const earning of earnings as any[]) {
    const taskId = String(earning.taskId);
    const keeper = retained.get(taskId);
    if (!keeper) {
      retained.set(taskId, earning);
      continue;
    }
    reversed += 1;
    if (apply) {
      await mongoose.connection.collection("earnings").updateOne(
        { id: earning.id },
        {
          $set: {
            status: "REVERSED",
            "metadata.originalTaskId": taskId,
            "metadata.reversalOf": keeper.id,
            updatedAt: new Date(),
          },
          $unset: { taskId: "" },
        },
      );
    }
  }

  return { retained: retained.size, reversed };
}

async function main() {
  const apply = process.argv.includes("--apply");
  const mongoUri =
    process.env.MONGODB_URI ?? process.env.MONGO_URI ?? "mongodb://127.0.0.1:27017/mangaflow";
  await mongoose.connect(mongoUri);
  try {
    const result = await repairDuplicateTaskEarnings(apply);
    console.log(
      `${apply ? "Applied" : "Dry run"}: retained=${result.retained}, reversed=${result.reversed}.`,
    );
    if (!apply) console.log("Re-run with --apply to write changes.");
  } finally {
    await mongoose.disconnect();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
