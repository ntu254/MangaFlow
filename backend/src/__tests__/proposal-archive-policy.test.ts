import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import { ProposalModel, SeriesModel } from "../db/models.js";
import { seedDatabase } from "../seed.js";

let mongo: MongoMemoryReplSet;

async function loginAs(email: string, password = email) {
  const response = await request(createApp())
    .post("/api/auth/login")
    .send({ email, password })
    .expect(200);
  return response.body.data as { accessToken: string; user: { id: string; role: string } };
}

async function setProposalStatus(proposalId: string, status: string) {
  await ProposalModel.updateOne({ id: proposalId }, { $set: { status, updatedAt: new Date() } });
}

describe("PROP-001 — Proposal archive policy", () => {
  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongo.getUri());
  }, 30_000);

  beforeEach(async () => {
    await seedDatabase();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it("archives a DRAFT proposal and writes archivedAt + archivedById", async () => {
    await setProposalStatus("p-009", "DRAFT");
    const mangaka = await loginAs("inoue@beachread.jp");
    const app = createApp();

    const response = await request(app)
      .post("/api/proposals/p-009/actions/ARCHIVE")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ reason: "Out of date" })
      .expect(200);

    expect(response.body.data).toMatchObject({ status: "ARCHIVED" });

    const proposal = await ProposalModel.findOne({ id: "p-009" }).lean();
    expect((proposal as any).archivedAt).toBeTruthy();
    expect((proposal as any).archivedById).toBe("u-mangaka");
    expect((proposal as any).archiveReason).toBe("Out of date");
  });

  it("blocks ARCHIVE on APPROVED proposals (PROPOSAL_NOT_ARCHIVABLE)", async () => {
    await setProposalStatus("p-009", "APPROVED");
    const mangaka = await loginAs("inoue@beachread.jp");
    const app = createApp();

    const response = await request(app)
      .post("/api/proposals/p-009/actions/ARCHIVE")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ reason: "Trying to archive a production proposal" })
      .expect(409);

    expect(response.body.code).toBe("PROPOSAL_NOT_ARCHIVABLE");
  });

  it("blocks ARCHIVE on BOARD_REVIEW proposals (PROPOSAL_NOT_ARCHIVABLE)", async () => {
    await setProposalStatus("p-009", "BOARD_REVIEW");
    const mangaka = await loginAs("inoue@beachread.jp");
    const app = createApp();

    const response = await request(app)
      .post("/api/proposals/p-009/actions/ARCHIVE")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ reason: "Trying to short-circuit board review" })
      .expect(409);

    expect(response.body.code).toBe("PROPOSAL_NOT_ARCHIVABLE");
  });

  it("requires release flag for PENDING_EDITOR before archive", async () => {
    await setProposalStatus("p-009", "PENDING_EDITOR");
    const mangaka = await loginAs("inoue@beachread.jp");
    const app = createApp();

    const blocked = await request(app)
      .post("/api/proposals/p-009/actions/ARCHIVE")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ reason: "Premature archive" })
      .expect(409);

    expect(blocked.body.code).toBe("PROPOSAL_ARCHIVE_REQUIRES_RELEASE");

    const allowed = await request(app)
      .post("/api/proposals/p-009/actions/ARCHIVE")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ reason: "Released and archived", releasedForArchive: true })
      .expect(200);

    expect(allowed.body.data.status).toBe("ARCHIVED");
  });

  it("archives REJECTED + WITHDRAWN proposals without restrictions", async () => {
    for (const status of ["REJECTED", "WITHDRAWN"]) {
      await setProposalStatus("p-009", status);
      const mangaka = await loginAs("inoue@beachread.jp");
      const response = await request(createApp())
        .post("/api/proposals/p-009/actions/ARCHIVE")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .send({ reason: `Cleanup from ${status}` })
        .expect(200);
      expect(response.body.data.status).toBe("ARCHIVED");
    }
  });

  it("refuses to archive someone else's proposal (FORBIDDEN)", async () => {
    // p-007 is authored by u-editor; u-mangaka is a different Mangaka.
    await setProposalStatus("p-007", "DRAFT");
    const mangaka = await loginAs("inoue@beachread.jp");
    const response = await request(createApp())
      .post("/api/proposals/p-007/actions/ARCHIVE")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ reason: "Hijack" })
      .expect(403);

    expect(response.body.code).toBe("FORBIDDEN");
  });
});