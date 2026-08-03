/**
 * Remove the retired editor designation from persisted data.
 *
 * Dry-run by default; pass --apply to persist the idempotent migration.
 */
import "dotenv/config";
import mongoose from "mongoose";

const apply = process.argv.includes("--apply");
const mongoUri = process.env.MONGO_URI ?? process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/mangaflow";

async function main() {
  await mongoose.connect(mongoUri);
  const users = mongoose.connection.db!.collection("users");
  const proposals = mongoose.connection.db!.collection("proposals");
  const series = mongoose.connection.db!.collection("series");
  const seriesMembers = mongoose.connection.db!.collection("seriesmembers");
  const userCount = await users.countDocuments({ isEditorInChief: true });
  const proposalCount = await proposals.countDocuments({ "votes.isEditorInChief": { $exists: true } });
  const legacySeries = await series
    .find({ editorId: { $type: "string", $ne: "" } }, { projection: { id: 1, editorId: 1 } })
    .toArray();
  const activeEditors = new Set(
    (
      await users
        .find({ role: "EDITOR", active: { $ne: false } }, { projection: { id: 1 } })
        .toArray()
    ).map((user: any) => String(user.id)),
  );
  const seriesMemberships = legacySeries.filter((item: any) => activeEditors.has(String(item.editorId)));
  const legacyEditorRoleCount = await users.countDocuments({ role: { $in: ["EDITOR_IN_CHIEF", "EIC"] } });

  if (!apply) {
    console.log(
      `Dry run: ${userCount} designation flag(s), ${legacyEditorRoleCount} legacy role(s), ${proposalCount} proposal vote flag(s), and ${seriesMemberships.length} legacy Tantou assignment(s) require migration.`,
    );
    return;
  }

  const usersResult = await users.updateMany(
    { $or: [{ role: { $in: ["EDITOR_IN_CHIEF", "EIC"] } }, { isEditorInChief: true }] },
    { $set: { role: "EDITOR" }, $unset: { isEditorInChief: "" } },
  );
  await users.updateMany({}, { $unset: { isEditorInChief: "" } });
  const proposalsResult = await proposals.updateMany(
    { "votes.isEditorInChief": { $exists: true } },
    { $unset: { "votes.$[].isEditorInChief": "" } },
  );
  {
    // Normalize pre-migration data before the partial unique index is built:
    // keep the legacy Series.editorId when it points to an active Editor and
    // deactivate any competing active Editor memberships. For orphaned series,
    // retain only the oldest active membership as the canonical Tantou.
    const desiredTantouBySeries = new Map(
      seriesMemberships.map((item: any) => [String(item.id), String(item.editorId)]),
    );
    const activeMemberships = await seriesMembers
      .find({ role: "editor", status: "active" })
      .sort({ createdAt: 1, id: 1 })
      .toArray();
    const retainedBySeries = new Set<string>();
    for (const membership of activeMemberships as any[]) {
      const seriesId = String(membership.seriesId);
      const desiredUserId = desiredTantouBySeries.get(seriesId);
      const shouldRetain = desiredUserId
        ? String(membership.userId) === desiredUserId && !retainedBySeries.has(seriesId)
        : !retainedBySeries.has(seriesId);
      if (shouldRetain) {
        retainedBySeries.add(seriesId);
        continue;
      }
      await seriesMembers.updateOne(
        { _id: membership._id },
        { $set: { status: "inactive", updatedAt: new Date() } },
      );
    }
    if (seriesMemberships.length > 0) {
      await seriesMembers.bulkWrite(
        seriesMemberships.map((item: any) => ({
        updateOne: {
          filter: { seriesId: String(item.id), userId: String(item.editorId), role: "editor" },
          update: {
            $set: {
              id: `sm-legacy-${String(item.id)}-${String(item.editorId)}`,
              seriesId: String(item.id),
              userId: String(item.editorId),
              role: "editor",
              status: "active",
              scope: "full_series",
              assignedChapterIds: [],
              assignedTaskIds: [],
              updatedAt: new Date(),
            },
            $setOnInsert: { createdAt: new Date() },
          },
          upsert: true,
        },
        })),
      );
    }
  }
  console.log(
    `Migrated ${usersResult.modifiedCount} user(s), ${proposalsResult.modifiedCount} proposal(s), and ${seriesMemberships.length} Tantou assignment(s).`,
  );
}

try {
  await main();
} finally {
  await mongoose.disconnect();
}
