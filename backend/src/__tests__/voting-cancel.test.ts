import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import { ProposalModel, VotingSessionModel, ProposalVoteModel } from "../db/models.js";
import { seedDatabase } from "../seed.js";

let mongo: MongoMemoryReplSet;

async function loginAs(email: string, password = email) {
  const response = await request(createApp())
    .post("/api/auth/login")
    .send({ email, password })
    .expect(200);
  return response.body.data as { accessToken: string; user: { id: string; role: string } };
}

async function openSession(chairToken: string, proposalId: string) {
  await ProposalModel.create({ id: proposalId, title: "P", authorId: "u-mangaka", authorName: "Inoue", status: "PENDING_BOARD" });
  const s = await request(createApp()).post("/api/voting-sessions")
    .set("Authorization", `Bearer ${chairToken}`).send({ proposalId }).expect(201);
  return s.body.data.id as string;
}

describe("CT-02 voting-session cancel restores Proposal", () => {
  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongo.getUri());
  });

  beforeEach(async () => {
    await seedDatabase();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it("cancels an OPEN session and restores the Proposal to PENDING_BOARD, keeping votes", async () => {
    const chair = await loginAs("board@beachread.jp");
    const sessionId = await openSession(chair.accessToken, "prop-cancel-1");
    await ProposalVoteModel.create({ id: "pv-c1", sessionId, proposalId: "prop-cancel-1", voterId: "u-board-2", voterName: "Sato", voterRole: "BOARD", decision: "APPROVE", votedAt: new Date() });
    await request(createApp()).post(`/api/voting-sessions/${sessionId}/cancel`)
      .set("Authorization", `Bearer ${chair.accessToken}`).send({}).expect(200);
    expect((await VotingSessionModel.findOne({ id: sessionId }).lean() as any).status).toBe("CANCELLED");
    expect((await ProposalModel.findOne({ id: "prop-cancel-1" }).lean() as any).status).toBe("PENDING_BOARD");
    expect(await ProposalVoteModel.countDocuments({ sessionId })).toBe(1);
  });

  it("fails closed when the linked Proposal is not BOARD_REVIEW (409, session unchanged)", async () => {
    const chair = await loginAs("board@beachread.jp");
    const sessionId = await openSession(chair.accessToken, "prop-cancel-2");
    await ProposalModel.updateOne({ id: "prop-cancel-2" }, { $set: { status: "APPROVED" } });
    await request(createApp()).post(`/api/voting-sessions/${sessionId}/cancel`)
      .set("Authorization", `Bearer ${chair.accessToken}`).send({}).expect(409);
    expect((await VotingSessionModel.findOne({ id: sessionId }).lean() as any).status).not.toBe("CANCELLED");
  });

  it("allows a fresh session after cancellation that does not count the cancelled session's votes", async () => {
    const chair = await loginAs("board@beachread.jp");
    const sessionId = await openSession(chair.accessToken, "prop-cancel-3");
    await ProposalVoteModel.create({ id: "pv-c3", sessionId, proposalId: "prop-cancel-3", voterId: "u-board-2", voterName: "Sato", voterRole: "BOARD", decision: "APPROVE", votedAt: new Date() });
    await request(createApp()).post(`/api/voting-sessions/${sessionId}/cancel`)
      .set("Authorization", `Bearer ${chair.accessToken}`).send({}).expect(200);
    const s2 = await request(createApp()).post("/api/voting-sessions")
      .set("Authorization", `Bearer ${chair.accessToken}`).send({ proposalId: "prop-cancel-3" }).expect(201);
    expect(s2.body.data.id).not.toBe(sessionId);
    // votes are scoped to their session: the new session sees none from the cancelled one
    expect(await ProposalVoteModel.countDocuments({ sessionId: s2.body.data.id })).toBe(0);
  });
});
