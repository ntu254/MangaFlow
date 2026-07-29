import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { SeriesModel } from "../db/models.js";
import {
  cadenceFromPublicationType,
  ensureProductionSeriesForApprovedProposal,
  normalizePublicationType,
} from "../services/proposal-lifecycle.service.js";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

beforeEach(async () => {
  if (!mongoose.connection.db) throw new Error("Mongo connection is not ready.");
  await mongoose.connection.db.dropDatabase();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe("Proposal lifecycle promotion", () => {
  it("normalizes only the canonical publication types", () => {
    expect(normalizePublicationType("weekly")).toBe("WEEKLY");
    expect(normalizePublicationType("MONTHLY")).toBe("MONTHLY");
    expect(normalizePublicationType("daily")).toBeNull();
    expect(cadenceFromPublicationType("WEEKLY")).toBe("weekly");
    expect(cadenceFromPublicationType("unknown")).toBe("monthly");
  });

  it("does not promote a non-approved Proposal", async () => {
    await expect(
      ensureProductionSeriesForApprovedProposal({
        id: "proposal-not-approved",
        status: "PENDING_BOARD",
        authorId: "u-mangaka",
      }),
    ).resolves.toBeNull();
    await expect(SeriesModel.countDocuments({})).resolves.toBe(0);
  });

  it("creates one PRE_PRODUCTION Series and remains idempotent", async () => {
    const proposal = {
      id: "proposal-lifecycle-idempotent",
      status: "APPROVED",
      title: "Lifecycle Test",
      synopsis: "Approved proposal",
      authorId: "u-mangaka",
      authorName: "Inoue Takehiko",
      requestedPublicationType: "WEEKLY",
      currentVersionId: "2",
    };

    const first = await ensureProductionSeriesForApprovedProposal(proposal);
    const second = await ensureProductionSeriesForApprovedProposal(proposal);
    const records = await SeriesModel.find({ sourceProposalId: proposal.id }).lean();

    expect(first?.id).toBe(`s-${proposal.id}`);
    expect(second?.id).toBe(first?.id);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      id: `s-${proposal.id}`,
      status: "PRE_PRODUCTION",
      publicationType: "WEEKLY",
      cadence: "weekly",
      sourceProposalVersionId: "2",
    });
  });
});
