/**
 * Remove the retired Material lifecycle from stored Supporting Materials.
 *
 * Dry-run is the default. Pass --apply only after reviewing the report:
 *   npm run migrate:material-attachments
 *   npm run migrate:material-attachments:apply
 */

import "dotenv/config";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import {
  cleanProposalAttachmentArrays,
  planMaterialAttachmentMigration,
} from "../services/material-attachment-migration.service.js";

type MaterialMigrationRecord = {
  id: string;
  status?: unknown;
  metadata?: unknown;
};

type ProposalMigrationRecord = {
  id: string;
  manuscripts?: Record<string, unknown>[];
  materials?: Record<string, unknown>[];
};

export type MaterialAttachmentMigrationSummary = {
  cleanStatusIds: string[];
  removeIds: string[];
  skipped: number;
};

export function summarizeMaterialAttachmentMigration(
  records: MaterialMigrationRecord[],
): MaterialAttachmentMigrationSummary {
  const summary: MaterialAttachmentMigrationSummary = {
    cleanStatusIds: [],
    removeIds: [],
    skipped: 0,
  };
  for (const record of records) {
    const plan = planMaterialAttachmentMigration(record);
    if (plan.action === "CLEAN_STATUS") summary.cleanStatusIds.push(record.id);
    else if (plan.action === "REMOVE") summary.removeIds.push(record.id);
    else summary.skipped += 1;
  }
  return summary;
}

const apply = process.argv.includes("--apply");
const explicitDryRun = process.argv.includes("--dry-run");
if (apply && explicitDryRun) throw new Error("--apply and --dry-run are mutually exclusive.");
const mongoUri =
  process.env.MONGO_URI ?? process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/mangaflow";

async function main() {
  await mongoose.connect(mongoUri);
  const materials = mongoose.connection.db!.collection<MaterialMigrationRecord>("materials");
  const proposals = mongoose.connection.db!.collection<ProposalMigrationRecord>("proposals");
  const records = (await materials
    .find({ $or: [{ status: { $exists: true } }, { "metadata.status": { $exists: true } }] })
    .project({ id: 1, status: 1, metadata: 1 })
    .toArray()) as unknown as MaterialMigrationRecord[];
  const summary = summarizeMaterialAttachmentMigration(records);
  const proposalRecords = (await proposals
    .find({
      $or: [
        { "manuscripts.status": { $exists: true } },
        { "manuscripts.metadata.status": { $exists: true } },
        { "materials.status": { $exists: true } },
        { "materials.metadata.status": { $exists: true } },
      ],
    })
    .project({ id: 1, manuscripts: 1, materials: 1 })
    .toArray()) as unknown as ProposalMigrationRecord[];
  const proposalCandidates = proposalRecords
    .map((record) => ({ id: record.id, ...cleanProposalAttachmentArrays(record) }))
    .filter((record) => record.changed);

  console.log(`Supporting Material migration: ${records.length} record(s) inspected.`);
  console.log(
    `Clean status: ${summary.cleanStatusIds.length}; remove archived: ${summary.removeIds.length}; skipped: ${summary.skipped}.`,
  );
  summary.cleanStatusIds.forEach((id) => console.log(`  CLEAN ${id}`));
  summary.removeIds.forEach((id) => console.log(`  REMOVE ARCHIVED ${id}`));
  console.log(`Proposal attachment arrays to clean: ${proposalCandidates.length}.`);
  proposalCandidates.forEach((record) => console.log(`  CLEAN PROPOSAL ${record.id}`));

  if (!apply) {
    console.log("Dry run: no documents changed. Re-run with the :apply script to persist.");
    return;
  }

  for (const id of summary.cleanStatusIds) {
    await materials.updateOne(
      { id },
      { $unset: { status: "", "metadata.status": "" } },
    );
  }
  for (const id of summary.removeIds) await materials.deleteOne({ id });
  for (const proposal of proposalCandidates) {
    await proposals.updateOne(
      { id: proposal.id },
      { $set: { manuscripts: proposal.manuscripts, materials: proposal.materials } },
    );
  }
  console.log("Migration complete. A second run should report zero changed records.");
}

if (process.argv[1] && resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1])) {
  try {
    await main();
  } finally {
    await mongoose.disconnect();
  }
}
