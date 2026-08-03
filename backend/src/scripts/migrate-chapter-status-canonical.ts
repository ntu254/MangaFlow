/**
 * Convert legacy chapter.status values to the canonical set.
 *
 *   PLANNED → IN_PRODUCTION → TANTOU_REVIEW ⇄ REVISION_REQUIRED
 *           → READY_FOR_PUBLICATION → PUBLISHED
 *
 * Mapping:
 *   DRAFTING, ASSISTANT_WORKING, MANGAKA_REVIEW → IN_PRODUCTION
 *   EDITOR_REVIEW, IN_REVIEW                    → TANTOU_REVIEW if a valid
 *                                                 review snapshot exists,
 *                                                 otherwise IN_PRODUCTION
 *   REVISION                                    → REVISION_REQUIRED
 *   EDITOR_APPROVED, APPROVED                   → READY_FOR_PUBLICATION
 *   ARCHIVED                                    → PUBLISHED, READY_FOR_PUBLICATION,
 *                                                 IN_PRODUCTION, or PLANNED from evidence
 *
 * Usage:
 *   tsx src/scripts/migrate-chapter-status-canonical.ts           # dry run
 *   tsx src/scripts/migrate-chapter-status-canonical.ts --apply   # write
 */
import mongoose from "mongoose";
import { ChapterModel } from "../db/models.js";

const apply = process.argv.includes("--apply");
const mongoUri =
  process.env.MONGODB_URI ?? process.env.MONGO_URI ?? "mongodb://127.0.0.1:27017/mangaflow";

const LEGACY_STATUSES = [
  "DRAFTING",
  "ASSISTANT_WORKING",
  "MANGAKA_REVIEW",
  "EDITOR_REVIEW",
  "IN_REVIEW",
  "REVISION",
  "EDITOR_APPROVED",
  "APPROVED",
  // Scheduling moved entirely to Publication.status; the chapter reverts to
  // READY_FOR_PUBLICATION (its SCHEDULED Publication, if any, is untouched).
  "SCHEDULED",
  // Chapters now follow the Series lifecycle and cannot be archived separately.
  "ARCHIVED",
];

/** A snapshot is "valid enough" to keep the chapter in TANTOU_REVIEW. */
function hasReviewSnapshot(chapter: any): boolean {
  const snapshot = chapter?.reviewSnapshot;
  return Boolean(
    snapshot &&
      (snapshot.frozenAt ||
        snapshot.chapterVersionId ||
        Array.isArray(snapshot.pageVersionIds)),
  );
}

function canonicalStatus(chapter: any): string | null {
  switch (chapter.status) {
    case "DRAFTING":
    case "ASSISTANT_WORKING":
    case "MANGAKA_REVIEW":
      return "IN_PRODUCTION";
    case "EDITOR_REVIEW":
    case "IN_REVIEW":
      // Without a frozen snapshot the Editor could not approve; send the
      // chapter back to production so a clean SUBMIT_REVIEW re-freezes one.
      return hasReviewSnapshot(chapter) ? "TANTOU_REVIEW" : "IN_PRODUCTION";
    case "REVISION":
      return "REVISION_REQUIRED";
    case "EDITOR_APPROVED":
    case "APPROVED":
    case "SCHEDULED":
      return "READY_FOR_PUBLICATION";
    case "ARCHIVED":
      if (chapter.publishedAt) return "PUBLISHED";
      if (
        chapter.readyForPublicationAt ||
        chapter.readyByEditorId ||
        chapter.scheduledAt ||
        (Array.isArray(chapter.pages) &&
          chapter.pages.length > 0 &&
          chapter.pages.every((page: any) => page.status === "FINALIZED"))
      ) {
        return "READY_FOR_PUBLICATION";
      }
      return Array.isArray(chapter.pages) && chapter.pages.length > 0
        ? "IN_PRODUCTION"
        : "PLANNED";
    default:
      return null;
  }
}

async function main() {
  await mongoose.connect(mongoUri);
  const chapters = await ChapterModel.find({ status: { $in: LEGACY_STATUSES } }).lean();

  const plan = chapters
    .map((chapter: any) => ({
      id: chapter.id,
      from: chapter.status,
      to: canonicalStatus(chapter),
      removeArchiveMetadata: chapter.status === "ARCHIVED",
    }))
    .filter((row) => row.to && row.to !== row.from);

  console.log(`Found ${plan.length} chapter(s) with legacy status to migrate.`);
  for (const row of plan) {
    console.log(`  ${row.id}: ${row.from} -> ${row.to}`);
  }

  if (!apply) {
    console.log("\nDry run only. Re-run with --apply to write changes.");
    await mongoose.disconnect();
    return;
  }

  const now = new Date().toISOString();
  for (const row of plan) {
    const update: Record<string, unknown> = {
      $set: { status: row.to, updatedAt: now },
    };
    if (row.removeArchiveMetadata) {
      update.$unset = { archivedAt: "", archivedById: "", archiveReason: "" };
    }
    await ChapterModel.updateOne(
      { id: row.id },
      update,
    );
  }
  console.log(`\nApplied ${plan.length} update(s).`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
