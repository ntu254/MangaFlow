/**
 * Promote legacy metadata.status values to the canonical material.status field.
 *
 * Dry-run is the default. Pass --apply only after reviewing the report:
 *   npm run migrate:material-status -- --dry-run
 *   npm run migrate:material-status -- --apply
 */

import "dotenv/config";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { planMaterialStatusMigration } from "../services/material-status.service.js";

type MaterialMigrationRecord = {
  id: string;
  status?: unknown;
  metadata?: unknown;
};

export type MaterialStatusMigrationSummary = {
  candidates: Array<{ id: string; status: string }>;
  skipped: number;
  invalid: Array<{ id: string; source: string; value: unknown }>;
};

export function summarizeMaterialStatusMigration(
  records: MaterialMigrationRecord[],
): MaterialStatusMigrationSummary {
  const summary: MaterialStatusMigrationSummary = {
    candidates: [],
    skipped: 0,
    invalid: [],
  };

  for (const record of records) {
    const plan = planMaterialStatusMigration(record);
    if (plan.action === "MIGRATE") {
      summary.candidates.push({ id: record.id, status: plan.status });
    } else if (plan.action === "INVALID") {
      summary.invalid.push({ id: record.id, source: plan.source, value: plan.value });
    } else {
      summary.skipped += 1;
    }
  }

  return summary;
}

const apply = process.argv.includes("--apply");
const explicitDryRun = process.argv.includes("--dry-run");
if (apply && explicitDryRun) {
  throw new Error("--apply and --dry-run are mutually exclusive.");
}
const dryRun = explicitDryRun || !apply;
const mongoUri =
  process.env.MONGO_URI ?? process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/mangaflow";

async function main() {
  await mongoose.connect(mongoUri);
  const materials = mongoose.connection.db!.collection<MaterialMigrationRecord>("materials");
  const records = (await materials
    .find({ $or: [{ "metadata.status": { $exists: true } }, { status: { $exists: true } }] })
    .project({ id: 1, status: 1, metadata: 1 })
    .toArray()) as MaterialMigrationRecord[];
  const summary = summarizeMaterialStatusMigration(records);

  console.log(`Material status migration: ${records.length} record(s) inspected.`);
  console.log(`Candidates: ${summary.candidates.length}; skipped: ${summary.skipped}; invalid: ${summary.invalid.length}.`);
  for (const candidate of summary.candidates) {
    console.log(`  ${candidate.id}: metadata.status -> status=${candidate.status}`);
  }
  for (const invalid of summary.invalid) {
    console.error(
      `  INVALID ${invalid.id}: ${invalid.source} status=${JSON.stringify(invalid.value)}`,
    );
  }

  if (summary.invalid.length > 0) {
    throw new Error("Migration stopped because invalid material statuses require manual review.");
  }

  if (dryRun) {
    console.log("Dry run: no documents changed. Re-run with --apply to persist the migration.");
    return;
  }

  for (const candidate of summary.candidates) {
    const result = await materials.updateOne(
      { id: candidate.id, "metadata.status": candidate.status },
      {
        $set: { status: candidate.status },
        $unset: { "metadata.status": "" },
      },
    );
    console.log(`  Applied ${candidate.id}: ${result.modifiedCount ? "updated" : "already current"}.`);
  }
  console.log("Migration complete. A second run should report zero candidates.");
}

if (process.argv[1] && resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1])) {
  try {
    await main();
  } finally {
    await mongoose.disconnect();
  }
}
