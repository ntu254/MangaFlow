/**
 * Backfill page-level assignments from legacy active page tasks.
 *
 * Reads StudioTask records flagged with pageTaskActive, groups them by page,
 * and writes a pageAssignment (ACCEPTED) derived from the single active
 * assistant per page. Pages where multiple different assistants held active
 * tasks are reported as conflicts for manual resolution.
 *
 * The legacy unique index (studio_task_one_active_page_assignment) is dropped
 * once the migration completes.
 *
 * Dry-run by default; pass --apply to persist the idempotent migration.
 *
 * Usage:
 *   npm run migrate:page-assignment
 *   npm run migrate:page-assignment -- --apply
 */

import "dotenv/config";
import mongoose from "mongoose";
import {
  collectPageAssignmentMigrationRecords,
  planPageAssignmentMigration,
  applyPageAssignmentMigration,
  dropLegacyPageTaskUniqueIndex,
} from "../services/page-assignment-migration.service.js";

const apply = process.argv.includes("--apply");
const explicitDryRun = process.argv.includes("--dry-run");
if (apply && explicitDryRun) {
  throw new Error("--apply and --dry-run are mutually exclusive.");
}
const mongoUri =
  process.env.MONGO_URI ?? process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/mangaflow";

async function main() {
  await mongoose.connect(mongoUri);
  const records = await collectPageAssignmentMigrationRecords();
  const plans = records.map(planPageAssignmentMigration);
  const assignPlans = plans.filter((plan) => plan.action === "ASSIGN");
  const conflicts = plans.filter((plan) => plan.action === "CONFLICT");

  console.log(
    `Dry run: ${records.length} page(s) with legacy active tasks; ` +
      `${assignPlans.length} ready to assign, ${conflicts.length} conflicted, ` +
      `${plans.length - assignPlans.length - conflicts.length} skipped.`,
  );
  if (conflicts.length > 0) {
    console.log("CONFLICTS (multiple assistants on one page — resolve manually):");
    for (const conflict of conflicts) {
      console.log(`  - ${conflict.pageId}: ${conflict.conflict?.join(", ")}`);
    }
  }
  if (!apply) return;

  const result = await applyPageAssignmentMigration(plans);
  const dropped = await dropLegacyPageTaskUniqueIndex();
  console.log(
    `Applied: ${result.assigned} page(s) assigned, ${result.skipped} skipped, ` +
      `${result.conflicts.length} conflicted; unique index dropped: ${dropped}.`,
  );
}

try {
  await main();
} finally {
  await mongoose.disconnect();
}
