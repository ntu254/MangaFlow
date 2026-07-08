import mongoose from "mongoose";
import * as dotenv from "dotenv";

dotenv.config({ path: "backend/.env" });

const mongoUri =
  process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/mangaflow";
const dryRun = process.argv.includes("--dry-run");

/**
 * Series created from a Board-approved proposal used to start in "PLANNING", but there is no
 * lifecycle transition to "ONGOING", which blocks "Send to Editor Review". New approvals now
 * create series directly as ONGOING; this backfill activates existing PLANNING series whose
 * source proposal is APPROVED.
 */
async function run() {
  console.log(`${dryRun ? "[dry-run] " : ""}Activating PLANNING series with approved proposals`);
  await mongoose.connect(mongoUri);
  try {
    const series = mongoose.connection.db!.collection("series");
    const proposals = mongoose.connection.db!.collection("proposals");

    const planning = await series
      .find(
        { status: "PLANNING" },
        { projection: { id: 1, proposalId: 1, sourceProposalId: 1, title: 1 } },
      )
      .toArray();

    const updates: { _id: import("mongodb").ObjectId; id: unknown; title: unknown }[] = [];
    for (const row of planning) {
      const proposalId = row.sourceProposalId ?? row.proposalId;
      if (!proposalId) continue;
      const proposal = await proposals.findOne(
        { id: proposalId, status: "APPROVED" },
        { projection: { id: 1 } },
      );
      if (proposal) updates.push({ _id: row._id, id: row.id, title: row.title });
    }

    if (!dryRun && updates.length > 0) {
      await series.bulkWrite(
        updates.map((row) => ({
          updateOne: {
            filter: { _id: row._id, status: "PLANNING" },
            update: { $set: { status: "ONGOING", updatedAt: new Date().toISOString() } },
          },
        })),
      );
    }

    console.log(
      `series: planning=${planning.length}, ${dryRun ? "wouldActivate" : "activated"}=${updates.length}`,
    );
    if (updates.length > 0) {
      console.log(`  activated ids: ${updates.map((row) => row.id ?? row._id).join(", ")}`);
    }
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
