/**
 * Migration Script: Schema V2 — Production-Ready MangaFlow
 *
 * Run this ONCE against existing data before deploying the new schema.
 * Safe to run multiple times (idempotent).
 *
 * Usage:
 *   npx tsx backend/src/scripts/migrate-schema-v2.ts
 *
 * What it does:
 *   1. Chapter.status: APPROVED → EDITOR_APPROVED, IN_REVIEW → EDITOR_REVIEW
 *   2. StudioTask.status: OPEN → TODO, REVISION_REQUESTED → MANGAKA_REVISION_REQUESTED
 *   3. StudioComment: copy text→body, blocking→isBlocking where missing
 *   4. Material: copy type→kind where kind is missing
 *   5. Material: ACTIVE status is already in enum (kept as-is)
 *   6. Proposal.votes: copy to proposalvotes collection if not already there
 *   7. Series: add default visibility if missing
 *   8. Submission.status: APPROVED → EDITOR_APPROVED, REVISION_REQUESTED → MANGAKA_REVISION_REQUESTED
 */

import mongoose from "mongoose";
import * as dotenv from "dotenv";
dotenv.config({ path: "backend/.env" });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/mangaflow";

async function run() {
  console.log("Connecting to MongoDB:", MONGO_URI.replace(/\/\/.*@/, "//***@"));
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db!;

  let changed = 0;

  // -----------------------------------------------------------------------
  // 1. Chapter status migration
  // -----------------------------------------------------------------------
  console.log("\n[1] Migrating Chapter statuses...");

  const chapterApproved = await db.collection("chapters").updateMany(
    { status: "APPROVED" },
    { $set: { status: "EDITOR_APPROVED" } }
  );
  console.log(`  APPROVED → EDITOR_APPROVED: ${chapterApproved.modifiedCount} docs`);
  changed += chapterApproved.modifiedCount;

  const chapterInReview = await db.collection("chapters").updateMany(
    { status: "IN_REVIEW" },
    { $set: { status: "EDITOR_REVIEW" } }
  );
  console.log(`  IN_REVIEW → EDITOR_REVIEW: ${chapterInReview.modifiedCount} docs`);
  changed += chapterInReview.modifiedCount;

  // -----------------------------------------------------------------------
  // 2. StudioTask status migration
  // -----------------------------------------------------------------------
  console.log("\n[2] Migrating StudioTask statuses...");

  const taskOpen = await db.collection("studiotasks").updateMany(
    { status: "OPEN" },
    { $set: { status: "TODO" } }
  );
  console.log(`  OPEN → TODO: ${taskOpen.modifiedCount} docs`);
  changed += taskOpen.modifiedCount;

  const taskRevision = await db.collection("studiotasks").updateMany(
    { status: "REVISION_REQUESTED" },
    { $set: { status: "MANGAKA_REVISION_REQUESTED" } }
  );
  console.log(`  REVISION_REQUESTED → MANGAKA_REVISION_REQUESTED: ${taskRevision.modifiedCount} docs`);
  changed += taskRevision.modifiedCount;

  const taskCompleted = await db.collection("studiotasks").updateMany(
    { status: "COMPLETED" },
    { $set: { status: "EDITOR_APPROVED" } }
  );
  console.log(`  COMPLETED → EDITOR_APPROVED: ${taskCompleted.modifiedCount} docs`);
  changed += taskCompleted.modifiedCount;

  // -----------------------------------------------------------------------
  // 3. StudioComment: text → body, blocking → isBlocking
  // -----------------------------------------------------------------------
  console.log("\n[3] Migrating StudioComment aliases...");

  const comments = await db.collection("studiocomments").find({}).toArray();
  let commentFixed = 0;
  for (const comment of comments) {
    const patch: Record<string, unknown> = {};
    if (!comment.body && comment.text) patch.body = comment.text;
    if (comment.isBlocking === undefined && comment.blocking !== undefined) {
      patch.isBlocking = comment.blocking;
    }
    if (Object.keys(patch).length > 0) {
      await db.collection("studiocomments").updateOne(
        { _id: comment._id },
        { $set: patch }
      );
      commentFixed++;
    }
  }
  console.log(`  Normalized text→body, blocking→isBlocking: ${commentFixed} docs`);
  changed += commentFixed;

  // -----------------------------------------------------------------------
  // 4. Material: type → kind (where kind is empty/missing)
  // -----------------------------------------------------------------------
  console.log("\n[4] Migrating Material kind/type alias...");

  const materials = await db.collection("materials").find({
    $and: [
      { $or: [{ kind: { $exists: false } }, { kind: null }, { kind: "" }] },
      { $or: [{ type: { $exists: true } }, { type: { $ne: null } }] }
    ]
  }).toArray();

  let materialFixed = 0;
  for (const mat of materials) {
    if (mat.type && !mat.kind) {
      await db.collection("materials").updateOne(
        { _id: mat._id },
        { $set: { kind: mat.type } }
      );
      materialFixed++;
    }
  }
  console.log(`  type→kind copied: ${materialFixed} docs`);
  changed += materialFixed;

  // -----------------------------------------------------------------------
  // 5. Submission status migration
  // -----------------------------------------------------------------------
  console.log("\n[5] Migrating Submission statuses...");

  const subApproved = await db.collection("submissions").updateMany(
    { status: "APPROVED" },
    { $set: { status: "EDITOR_APPROVED" } }
  );
  console.log(`  APPROVED → EDITOR_APPROVED: ${subApproved.modifiedCount} docs`);
  changed += subApproved.modifiedCount;

  const subSubmitted = await db.collection("submissions").updateMany(
    { status: "SUBMITTED" },
    { $set: { status: "PENDING" } }
  );
  console.log(`  SUBMITTED → PENDING: ${subSubmitted.modifiedCount} docs`);
  changed += subSubmitted.modifiedCount;

  const subRevision = await db.collection("submissions").updateMany(
    { status: "REVISION_REQUESTED" },
    { $set: { status: "MANGAKA_REVISION_REQUESTED" } }
  );
  console.log(`  REVISION_REQUESTED → MANGAKA_REVISION_REQUESTED: ${subRevision.modifiedCount} docs`);
  changed += subRevision.modifiedCount;

  // Add default reviewStage where missing
  const subMissingStage = await db.collection("submissions").updateMany(
    { reviewStage: { $exists: false } },
    { $set: { reviewStage: "MANGAKA_REVIEW" } }
  );
  console.log(`  Added default reviewStage: ${subMissingStage.modifiedCount} docs`);
  changed += subMissingStage.modifiedCount;

  // -----------------------------------------------------------------------
  // 6. Proposal.votes → proposalvotes collection
  // -----------------------------------------------------------------------
  console.log("\n[6] Migrating Proposal.votes → proposalvotes collection...");

  const proposals = await db.collection("proposals").find({
    votes: { $exists: true, $not: { $size: 0 } }
  }).toArray();

  let votesMigrated = 0;
  for (const proposal of proposals) {
    for (const vote of (proposal.votes ?? [])) {
      const voterId = vote.voterId ?? vote.memberId;
      if (!voterId) continue;

      const exists = await db.collection("proposalvotes").findOne({
        proposalId: proposal.id,
        voterId,
        sessionId: vote.sessionId ?? null
      });

      if (!exists) {
        await db.collection("proposalvotes").insertOne({
          id: `pv-migrated-${proposal.id}-${voterId}`,
          sessionId: vote.sessionId ?? null,
          proposalId: proposal.id,
          voterId,
          voterName: vote.voterName ?? vote.memberName ?? "",
          voterRole: vote.voterRole ?? "BOARD",
          decision: vote.decision,
          comment: vote.comment ?? "",
          votedAt: vote.votedAt ?? vote.createdAt ?? new Date(),
          weight: vote.weight ?? 1,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        votesMigrated++;
      }
    }
  }
  console.log(`  Votes migrated to proposalvotes: ${votesMigrated} docs`);
  changed += votesMigrated;

  // -----------------------------------------------------------------------
  // 7. Series: add default visibility where missing
  // -----------------------------------------------------------------------
  console.log("\n[7] Setting default Series.visibility...");

  const seriesVis = await db.collection("series").updateMany(
    { visibility: { $exists: false } },
    { $set: { visibility: "PRIVATE" } }
  );
  console.log(`  Added default visibility: ${seriesVis.modifiedCount} docs`);
  changed += seriesVis.modifiedCount;

  // -----------------------------------------------------------------------
  // 8. StudioRegion: add default lockStatus where missing
  // -----------------------------------------------------------------------
  console.log("\n[8] Setting default StudioRegion.lockStatus...");

  const regionLock = await db.collection("studioregions").updateMany(
    { lockStatus: { $exists: false } },
    { $set: { lockStatus: "UNLOCKED" } }
  );
  console.log(`  Added default lockStatus: ${regionLock.modifiedCount} docs`);
  changed += regionLock.modifiedCount;

  // -----------------------------------------------------------------------
  // Done
  // -----------------------------------------------------------------------
  console.log(`\n✅ Migration complete. Total documents modified: ${changed}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
