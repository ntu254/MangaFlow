import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import { seedDatabase } from "../seed.js";
import {
  AuditEntryModel,
  ProposalModel,
  ProposalVersionModel,
  ProposalVoteModel,

    RankingModel,
  SeriesModel,
  UserModel,
  VotingSessionModel,
} from "../db/models.js";

let mongo: MongoMemoryReplSet;

beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = mongo.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  if (!mongoose.connection.db) {
    throw new Error("Mongo connection is not ready for board tests.");
  }
  await mongoose.connection.db.dropDatabase();
  await seedDatabase();
});

describe("MF-030A Board Queue Live Submission Review", () => {
  async function loginAs(email: string) {
    const res = await request(createApp()).post("/api/auth/login").send({ email, password: email });
    return res.body.data as { accessToken: string };
  }

  it("GET /api/board/queue returns PENDING_BOARD and TIE_BREAK proposals", async () => {
    await ProposalModel.create({
      id: "proposal-board-q",
      title: "Board Proposal Test",
      authorId: "u-mangaka",
      authorName: "Inoue Takehiko",
      synopsis: "Test synopsis",
      status: "PENDING_BOARD",
      genres: ["Action"],
      votes: [],
      history: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const board = await loginAs("board@beachread.jp");
    const res = await request(createApp())
      .get("/api/board/queue")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
    const found = res.body.data.find((p: any) => p.id === "proposal-board-q");
    expect(found).toBeDefined();
    expect(found.decisionStatus).toBe("PENDING");
  });

  it("GET /api/board/queue does not return APPROVED/REJECTED proposals", async () => {
    await ProposalModel.create({
      id: "proposal-approved",
      title: "Approved Proposal",
      authorId: "u-mangaka",
      authorName: "Inoue Takehiko",
      synopsis: "Test",
      status: "APPROVED",
      genres: ["Action"],
      votes: [],
      history: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const board = await loginAs("board@beachread.jp");
    const res = await request(createApp())
      .get("/api/board/queue")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .expect(200);

    const found = res.body.data.find((p: any) => p.id === "proposal-approved");
    expect(found).toBeUndefined();
  });

  it("GET /api/board/series/:id/votes returns votes and tally", async () => {
    await ProposalModel.create({
      id: "proposal-votes-test",
      title: "Votes Test",
      authorId: "u-mangaka",
      authorName: "Inoue Takehiko",
      synopsis: "Test",
      status: "BOARD_REVIEW",
      genres: ["Action"],
      activeVotingSessionId: "vs-votes-test",
      votes: [],
      history: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await VotingSessionModel.create({
      id: "vs-votes-test",
      title: "Votes Test Session",
      mode: "AD_HOC",
      targetType: "PROPOSAL",
      proposalId: "proposal-votes-test",
      proposalVersionId: "1",
      proposalIds: ["proposal-votes-test"],
      status: "OPEN",
      version: 1,
      quorum: 3,
      eligibleVoterIds: ["u-board", "u-board-2"],
      createdById: "u-board",
      createdByName: "Yamamoto Director",
      openedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await ProposalVoteModel.create([
      { id: "pv-votes-a", sessionId: "vs-votes-test", proposalId: "proposal-votes-test", voterId: "u-board", voterName: "Yamamoto Director", voterRole: "BOARD", decision: "APPROVE", weight: 1, votedAt: new Date() },
      { id: "pv-votes-b", sessionId: "vs-votes-test", proposalId: "proposal-votes-test", voterId: "u-board-2", voterName: "Sato Eriko", voterRole: "BOARD", decision: "APPROVE", weight: 1, votedAt: new Date() },
    ]);

    const board = await loginAs("board@beachread.jp");
    const res = await request(createApp())
      .get("/api/board/series/proposal-votes-test/votes")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .expect(200);

    expect(res.body.data.seriesId).toBe("proposal-votes-test");
    expect(Array.isArray(res.body.data.votes)).toBe(true);
    expect(res.body.data.votes.length).toBe(2);
    expect(res.body.data.tally).toBeDefined();
    expect(res.body.data.tally.approve).toBe(2);
  });

  it("uses the session quorum snapshot in the Board votes response", async () => {
    await ProposalModel.create({
      id: "proposal-quorum-snapshot-read",
      title: "Quorum Snapshot Read",
      authorId: "u-mangaka",
      authorName: "Inoue Takehiko",
      status: "BOARD_REVIEW",
      activeVotingSessionId: "vs-quorum-snapshot-read",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await VotingSessionModel.create({
      id: "vs-quorum-snapshot-read",
      title: "Quorum Snapshot Read Session",
      targetType: "PROPOSAL",
      proposalId: "proposal-quorum-snapshot-read",
      proposalIds: ["proposal-quorum-snapshot-read"],
      proposalVersionId: "1",
      status: "OPEN",
      quorum: 2,
      createdById: "u-board",
      createdByName: "Yamamoto Director",
      openedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const board = await loginAs("board@beachread.jp");
    const response = await request(createApp())
      .get("/api/board/series/proposal-quorum-snapshot-read/votes")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .expect(200);

    expect(response.body.data.quorum).toBe(2);
  });

  it("rejects immutable VotingSession fields and terminal session updates", async () => {
    await ProposalModel.create({
      id: "proposal-session-patch-integrity",
      title: "Session Patch Integrity",
      authorId: "u-mangaka",
      authorName: "Inoue Takehiko",
      status: "PENDING_BOARD",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const chair = await loginAs("board@beachread.jp");
    const created = await request(createApp())
      .post("/api/voting-sessions")
      .set("Authorization", `Bearer ${chair.accessToken}`)
      .send({ proposalId: "proposal-session-patch-integrity" })
      .expect(201);
    const sessionId = created.body.data.id;

    await request(createApp())
      .patch(`/api/voting-sessions/${sessionId}`)
      .set("Authorization", `Bearer ${chair.accessToken}`)
      .send({
        proposalId: "other-proposal",
        proposalIds: ["other-proposal"],
        proposalVersionId: "999",
        eligibleVoterIds: ["u-board"],
        quorum: 1,
        status: "FINALIZED",
        expectedVersion: 1,
      })
      .expect(400);

    await VotingSessionModel.updateOne({ id: sessionId }, { $set: { status: "CANCELLED" } });
    await request(createApp())
      .patch(`/api/voting-sessions/${sessionId}`)
      .set("Authorization", `Bearer ${chair.accessToken}`)
      .send({ title: "Must not update", expectedVersion: 1 })
      .expect(409);
  });

  it("POST /api/board/series/:id/votes casts vote and reaches quorum", async () => {
    await ProposalModel.create({
      id: "proposal-quorum-test",
      title: "Quorum Test",
      authorId: "u-mangaka",
      authorName: "Inoue Takehiko",
      synopsis: "Test",
      status: "PENDING_BOARD",
      genres: ["Action"],
      votes: [
        {
          memberId: "u-board",
          memberName: "Yamamoto Director",
          decision: "APPROVE",
          createdAt: new Date(),
        },
        {
          memberId: "u-board-2",
          memberName: "Sato Eriko",
          decision: "APPROVE",
          createdAt: new Date(),
        },
      ],
      history: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const chair = await loginAs("board@beachread.jp");
    const session = await request(createApp())
      .post("/api/voting-sessions")
      .set("Authorization", `Bearer ${chair.accessToken}`)
      .send({ proposalId: "proposal-quorum-test" })
      .expect(201);
    const sessionId = session.body.data.id;

    await request(createApp())
      .post("/api/board/series/proposal-quorum-test/votes")
      .set("Authorization", `Bearer ${chair.accessToken}`)
      .send({ voteDecision: "APPROVE", sessionId })
      .expect(200);
    const board2 = await loginAs("sato@beachread.jp");
    await request(createApp())
      .post("/api/board/series/proposal-quorum-test/votes")
      .set("Authorization", `Bearer ${board2.accessToken}`)
      .send({ voteDecision: "APPROVE", sessionId })
      .expect(200);
    const board3 = await loginAs("kobayashi@beachread.jp");
    await request(createApp())
      .post("/api/board/series/proposal-quorum-test/votes")
      .set("Authorization", `Bearer ${board3.accessToken}`)
      .send({ voteDecision: "APPROVE", sessionId })
      .expect(200);

    const res = await request(createApp())
      .post(`/api/voting-sessions/${sessionId}/close`)
      .set("Authorization", `Bearer ${chair.accessToken}`)
      .send({})
      .expect(200);

    expect(res.body.data.status).toBe("FINALIZED");
    expect(res.body.data.result).toBe("APPROVED");

    const series = await SeriesModel.find({ sourceProposalId: "proposal-quorum-test" }).lean();
    expect(series).toHaveLength(1);
    expect(series[0]).toMatchObject({
      id: "s-proposal-quorum-test",
      title: "Quorum Test",
      status: "PRE_PRODUCTION",
      sourceProposalId: "proposal-quorum-test",
      authorId: "u-mangaka",
    });

    const mangaka = await loginAs("inoue@beachread.jp");
    const mine = await request(createApp())
      .get("/api/series?mine=true")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .expect(200);
    expect(mine.body.data.some((s: any) => s.sourceProposalId === "proposal-quorum-test")).toBe(true);
  });

  it("snapshots the current active Board roster when opening a session", async () => {
    await ProposalModel.create({
      id: "proposal-live-electorate",
      title: "Live Electorate",
      authorId: "u-mangaka",
      authorName: "Inoue Takehiko",
      status: "PENDING_BOARD",
      currentVersion: 1,
      history: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await UserModel.updateOne({ id: "u-board-5" }, { $set: { active: false } });

    const chair = await loginAs("board@beachread.jp");
    const response = await request(createApp())
      .post("/api/voting-sessions")
      .set("Authorization", `Bearer ${chair.accessToken}`)
      .send({ proposalId: "proposal-live-electorate" })
      .expect(201);

    expect(response.body.data.eligibleVoterIds).toEqual([
      "u-board",
      "u-board-2",
      "u-board-3",
      "u-board-4",
    ]);
    expect(response.body.data.eligibleVoterIds).not.toContain("u-board-5");
  });

  it("POST /api/board/series/:id/votes rejects a duplicate vote in the same session", async () => {
    await ProposalModel.create({
      id: "proposal-dup-test",
      title: "Duplicate Vote Test",
      authorId: "u-mangaka",
      authorName: "Inoue Takehiko",
      synopsis: "Test",
      status: "PENDING_BOARD",
      genres: ["Action"],
      votes: [],
      history: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const board = await loginAs("board@beachread.jp");
    const session = await request(createApp())
      .post("/api/voting-sessions")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({ proposalId: "proposal-dup-test" })
      .expect(201);
    const sessionId = session.body.data.id;

    await request(createApp())
      .post("/api/board/series/proposal-dup-test/votes")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({ voteDecision: "APPROVE", sessionId })
      .expect(200);
    await request(createApp())
      .post("/api/board/series/proposal-dup-test/votes")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({ voteDecision: "REJECT", sessionId })
      .expect(409)
      .expect((res) => {
        expect(res.body.code).toBe("VOTE_ALREADY_CAST");
      });

    const votes = await ProposalVoteModel.find({ proposalId: "proposal-dup-test", sessionId }).lean();
    expect(votes).toHaveLength(1);
    expect((votes[0] as any).decision).toBe("APPROVE");
  });

  it("POST /api/voting-sessions/:id/cancel restores its proposal without deleting vote history", async () => {
    await ProposalModel.create({
      id: "proposal-cancel-test",
      title: "Cancelled Vote Test",
      authorId: "u-mangaka",
      authorName: "Inoue Takehiko",
      synopsis: "Test",
      status: "PENDING_BOARD",
      genres: ["Action"],
      votes: [],
      history: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const chair = await loginAs("board@beachread.jp");
    const session = await request(createApp())
      .post("/api/voting-sessions")
      .set("Authorization", `Bearer ${chair.accessToken}`)
      .send({ proposalId: "proposal-cancel-test" })
      .expect(201);
    const sessionId = session.body.data.id;
    await ProposalVoteModel.create({
      id: "pv-cancel-test",
      sessionId,
      proposalId: "proposal-cancel-test",
      voterId: "u-board",
      voterName: "Yamamoto Director",
      voterRole: "BOARD",
      decision: "APPROVE",
      weight: 1,
      votedAt: new Date(),
    });

    await request(createApp())
      .post(`/api/voting-sessions/${sessionId}/cancel`)
      .set("Authorization", `Bearer ${chair.accessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data.status).toBe("CANCELLED");
      });

    const proposal = await ProposalModel.findOne({ id: "proposal-cancel-test" }).lean();
    expect((proposal as any)?.status).toBe("PENDING_BOARD");
    expect((proposal as any)?.activeVotingSessionId).toBeUndefined();
    expect((proposal as any)?.activeProposalVersionId).toBeUndefined();
    expect(await ProposalVoteModel.countDocuments({ sessionId })).toBe(1);
    expect(await ProposalVersionModel.countDocuments({ proposalId: "proposal-cancel-test" })).toBe(1);

    await request(createApp())
      .post(`/api/voting-sessions/${sessionId}/cancel`)
      .set("Authorization", `Bearer ${chair.accessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data.status).toBe("CANCELLED");
      });

    expect(await AuditEntryModel.countDocuments({ action: "voting_session.cancel", entityId: sessionId })).toBe(1);
  });

  it("POST /api/board/series/:id/votes requires BOARD role", async () => {
    await ProposalModel.create({
      id: "proposal-rbac-test",
      title: "RBAC Test",
      authorId: "u-mangaka",
      authorName: "Inoue Takehiko",
      synopsis: "Test",
      status: "PENDING_BOARD",
      genres: ["Action"],
      votes: [],
      history: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const assistant = await loginAs("jun@beachread.jp");
    await request(createApp())
      .post("/api/board/series/proposal-rbac-test/votes")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({ voteDecision: "APPROVE" })
      .expect(403);
  });

  it("opens a fresh Board re-vote after a tied session", async () => {
    await ProposalModel.create({
      id: "proposal-tie-test",
      title: "Tie Break Test",
      authorId: "u-mangaka",
      authorName: "Inoue Takehiko",
      synopsis: "Test",
      status: "PENDING_BOARD",
      genres: ["Action"],
      votes: [],
      history: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const chair = await loginAs("board@beachread.jp");
    const session = await request(createApp())
      .post("/api/voting-sessions")
      .set("Authorization", `Bearer ${chair.accessToken}`)
      .send({ proposalId: "proposal-tie-test" })
      .expect(201);
    const sessionId = session.body.data.id;
    await ProposalVoteModel.create([
      { id: "pv-tie-a", sessionId, proposalId: "proposal-tie-test", voterId: "u-board", voterName: "Yamamoto Director", voterRole: "BOARD", decision: "APPROVE", weight: 1, votedAt: new Date() },
      { id: "pv-tie-r", sessionId, proposalId: "proposal-tie-test", voterId: "u-board-2", voterName: "Sato Eriko", voterRole: "BOARD", decision: "REJECT", weight: 1, votedAt: new Date() },
    ]);
    // Constrain the eligible board to the two actual voters so a 1-1 split is a
    // full-turnout tie. closeVotingSession derives "all eligible voted" from
    // session.eligibleVoterIds (not session.quorum), defaulting to the 5-member board.
    await VotingSessionModel.updateOne({ id: sessionId }, { $set: { eligibleVoterIds: ["u-board", "u-board-2"] } });
    await request(createApp())
      .post(`/api/voting-sessions/${sessionId}/close`)
      .set("Authorization", `Bearer ${chair.accessToken}`)
      .send({})
      .expect(200)
      .expect((res) => {
        expect(res.body.data.status).toBe("TIED");
      });

    const revote = (await VotingSessionModel.findOne({ reVoteOfSessionId: sessionId }).lean()) as any;
    expect(revote?.status).toBe("OPEN");
    expect(revote?.proposalId).toBe("proposal-tie-test");
  });

  it("does not expose a separate VotingSession tie-break command", async () => {
    await ProposalModel.create({
      id: "proposal-tie-approve-test",
      title: "Retired Tie Break Test",
      authorId: "u-mangaka",
      authorName: "Inoue Takehiko",
      synopsis: "Test",
      status: "PENDING_BOARD",
      genres: ["Action"],
      votes: [],
      history: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const chair = await loginAs("board@beachread.jp");
    const session = await request(createApp())
      .post("/api/voting-sessions")
      .set("Authorization", `Bearer ${chair.accessToken}`)
      .send({ proposalId: "proposal-tie-approve-test" })
      .expect(201);
    const sessionId = session.body.data.id;
    const response = await request(createApp())
      .post(`/api/voting-sessions/${sessionId}/tie-break`)
      .set("Authorization", `Bearer ${chair.accessToken}`)
      .send({ proposalId: "proposal-tie-approve-test", voteDecision: "APPROVE" })
      .expect(404);

    expect(response.body.code ?? response.body.message).toBeDefined();
  });

  it("POST /api/board/series/:id/decisions/finalize closes VotingSession for BOARD", async () => {
    await ProposalModel.create({
      id: "proposal-finalize-test",
      title: "Finalize Test",
      authorId: "u-mangaka",
      authorName: "Inoue Takehiko",
      synopsis: "Test",
      status: "PENDING_BOARD",
      genres: ["Action"],
      votes: [],
      history: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const board = await loginAs("board@beachread.jp");
    const session = await request(createApp())
      .post("/api/voting-sessions")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({ proposalId: "proposal-finalize-test", title: "Finalize Test Session" })
      .expect(201);
    const sessionId = session.body.data.id;

    await request(createApp())
      .post("/api/board/series/proposal-finalize-test/votes")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({ value: "APPROVE", sessionId })
      .expect(200);
    const board2 = await loginAs("sato@beachread.jp");
    await request(createApp())
      .post("/api/board/series/proposal-finalize-test/votes")
      .set("Authorization", `Bearer ${board2.accessToken}`)
      .send({ value: "APPROVE", sessionId })
      .expect(200);
    const board3 = await loginAs("kobayashi@beachread.jp");
    await request(createApp())
      .post("/api/board/series/proposal-finalize-test/votes")
      .set("Authorization", `Bearer ${board3.accessToken}`)
      .send({ value: "APPROVE", sessionId })
      .expect(200);

    const res = await request(createApp())
      .post("/api/board/series/proposal-finalize-test/decisions/finalize")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({ sessionId })
      .expect(200);

    expect(res.body.data.status).toBe("FINALIZED");
    expect(res.body.data.result).toBe("APPROVED");

    await request(createApp())
      .post("/api/board/series/proposal-finalize-test/decisions/finalize")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({ sessionId })
      .expect(200);

    const series = await SeriesModel.find({ sourceProposalId: "proposal-finalize-test" }).lean();
    expect(series).toHaveLength(1);
    expect(series[0]).toMatchObject({
      id: "s-proposal-finalize-test",
      title: "Finalize Test",
      sourceProposalId: "proposal-finalize-test",
    });
  });

  it("POST /api/board/series/:id/decisions/finalize blocks ADMIN normal bypass", async () => {
    const admin = await loginAs("admin@beachread.jp");
    const res = await request(createApp())
      .post("/api/board/series/proposal-finalize-admin/decisions/finalize")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({ sessionId: "vs-admin-bypass-test" })
      .expect(403);

    expect(res.body.code).toBe("BOARD_CHAIR_REQUIRED");
  });

  it("POST /api/board/series/:id/decisions/finalize blocks ASSISTANT", async () => {
    await ProposalModel.create({
      id: "proposal-finalize-assistant",
      title: "Finalize Assistant Test",
      authorId: "u-mangaka",
      authorName: "Inoue Takehiko",
      synopsis: "Test",
      status: "PENDING_BOARD",
      genres: ["Action"],
      votes: [],
      history: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const assistant = await loginAs("jun@beachread.jp");
    const res = await request(createApp())
      .post("/api/board/series/proposal-finalize-assistant/decisions/finalize")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({ decision: "APPROVED" })
      .expect(403);

    expect(res.body.code).toBe("BOARD_CHAIR_REQUIRED");
  });

  it("POST /api/board/series/:id/at-risk-decisions persists the decision on its at-risk ranking", async () => {
    await RankingModel.create({
      id: "ranking-at-risk-decision",
      seriesId: "series-001",
      seriesTitle: "At-risk series",
      period: "2026-W30",
      status: "AT_RISK",
      atRisk: true,
    });
    const board = await loginAs("board@beachread.jp");
    const res = await request(createApp())
      .post("/api/board/series/series-001/at-risk-decisions")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({ rankingId: "ranking-at-risk-decision", decision: "WARNING", note: "Test at-risk decision" })
      .expect(200);

    expect(res.body.data.seriesId).toBe("series-001");
    expect(res.body.data.decision).toBe("WARNING");
    expect((await RankingModel.findOne({ id: "ranking-at-risk-decision" }).lean() as any)?.metadata)
      .toMatchObject({
        atRiskDecision: {
          decision: "WARNING",
          note: "Test at-risk decision",
          decidedById: "u-board",
          decidedByName: "Yamamoto Director",
        },
      });
  });

  it("POST /api/board/series/:id/at-risk-decisions rejects a ranking from another series", async () => {
    await RankingModel.create({
      id: "ranking-other-series",
      seriesId: "series-other",
      seriesTitle: "Other series",
      period: "2026-W30",
      status: "AT_RISK",
      atRisk: true,
    });
    const board = await loginAs("board@beachread.jp");
    const res = await request(createApp())
      .post("/api/board/series/series-001/at-risk-decisions")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({ rankingId: "ranking-other-series", decision: "CONTINUE" })
      .expect(409);

    expect(res.body.code).toBe("RANKING_SERIES_MISMATCH");
  });

  it("POST /api/board/series/:id/at-risk-decisions rejects a missing ranking", async () => {
    const board = await loginAs("board@beachread.jp");
    const res = await request(createApp())
      .post("/api/board/series/series-001/at-risk-decisions")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({ rankingId: "ranking-missing", decision: "CONTINUE" })
      .expect(404);

    expect(res.body.code).toBe("RANKING_NOT_FOUND");
  });

  it("POST /api/board/series/:id/at-risk-decisions rejects a ranking that is not at risk", async () => {
    await RankingModel.create({
      id: "ranking-not-at-risk",
      seriesId: "series-001",
      seriesTitle: "Healthy series",
      period: "2026-W31",
      status: "SUBMITTED",
      atRisk: false,
    });
    const board = await loginAs("board@beachread.jp");
    const res = await request(createApp())
      .post("/api/board/series/series-001/at-risk-decisions")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({ rankingId: "ranking-not-at-risk", decision: "CONTINUE" })
      .expect(409);

    expect(res.body.code).toBe("RANKING_NOT_AT_RISK");
  });
});
