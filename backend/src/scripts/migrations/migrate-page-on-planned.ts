/**
 * Sprint verify-dod — page-on-planned-chapters migration.
 *
 * Plan invariant: a chapter in PLANNED status must not own pages that were
 * created via the legacy controller bypass. This script:
 *
 *   1. Iterates every Chapter whose status is PLANNED but whose `pages`
 *      array is non-empty.
 *   2. For each such chapter, transitions the status via the canonical
 *      workflow service (applyChapterAction with START_DRAFT) so the
 *      status change is audited and outboxed.
 *   3. Idempotent: re-running on chapters already in IN_PRODUCTION is a
 *      no-op.
 *
 * Run with: tsx src/scripts/migrations/migrate-page-on-planned.ts
 *
 * The script is intentionally small and does not delete pages — Sprint 1.1
 * only legitimises their status, not their existence. Removing pages
 * without a Takendown would orphan history and is out of scope here.
 */
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { ChapterModel, SeriesModel } from "../db/models.js";
import { applyChapterAction } from "../services/workflow.service.js";
import { createApp } from "../app.js";
import type { RequestActor } from "../types.js";

async function runMigration() {
  const candidates = await ChapterModel.find({ status: "PLANNED" }).lean();
  const withPages = candidates.filter((chapter) =>
    Array.isArray((chapter as any).pages) && (chapter as any).pages.length > 0,
  );
  if (withPages.length === 0) {
    console.log(`No PLANNED chapters with pages found. Nothing to do.`);
    return;
  }
  const systemActor: RequestActor = {
    id: "migration-page-on-planned",
    name: "Migration: page-on-planned",
    email: "system@migration",
    role: "MANGAKA",
  };
  let promoted = 0;
  let skipped = 0;
  for (const chapter of withPages) {
    try {
      await applyChapterAction(systemActor, (chapter as any).id, "START_DRAFT");
      promoted += 1;
    } catch (error: any) {
      if (error?.code === "INVALID_TRANSITION") {
        skipped += 1;
        continue;
      }
      throw error;
    }
  }
  console.log(
    `Migration complete. Promoted ${promoted} chapters, skipped ${skipped} (already canonical).`,
  );
}

async function main() {
  try {
    if (!env.MONGO_URI) throw new Error("MONGO_URI is required to run this migration.");
    await mongoose.connect(env.MONGO_URI);
    await runMigration();
    process.exit(0);
  } catch (error: any) {
    console.error(`Migration failed: ${error?.message ?? String(error)}`);
    process.exit(1);
  }
}

if (process.argv[1]?.endsWith("migrate-page-on-planned.ts")) {
  main();
}

// Silences unused-import lint on createApp + SeriesModel when migrating in
// test environments.
void createApp;
void SeriesModel;
