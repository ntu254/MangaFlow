import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import { seedDatabase } from "../seed.js";
import { ProposalModel, RankingModel, SeriesModel } from "../db/models.js";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
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

    const board3 = await loginAs("kobayashi@beachread.jp");
    const res = await request(createApp())
      .post("/api/board/series/proposal-quorum-test/votes")
      .set("Authorization", `Bearer ${board3.accessToken}`)
      .send({ voteDecision: "APPROVE" })
      .expect(200);

    expect(res.body.data.status).toBe("APPROVED");

    const series = await SeriesModel.find({ proposalId: "proposal-quorum-test" }).lean();
    expect(series).toHaveLength(1);
    expect(series[0]).toMatchObject({
      id: "s-proposal-quorum-test",
      title: "Quorum Test",
      status: "ONGOING",
      proposalId: "proposal-quorum-test",
      authorId: "u-mangaka",
    });

    const mangaka = await loginAs("inoue@beachread.jp");
    const mine = await request(createApp())
      .get("/api/series?mine=true")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .expect(200);
    expect(mine.body.data.some((s: any) => s.proposalId === "proposal-quorum-test")).toBe(true);
  });

  it("POST /api/board/series/:id/votes rejects duplicate vote with DUPLICATE_VOTE", async () => {
    await ProposalModel.create({
      id: "proposal-dup-test",
      title: "Duplicate Vote Test",
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
      ],
      history: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const board = await loginAs("board@beachread.jp");
    const res = await request(createApp())
      .post("/api/board/series/proposal-dup-test/votes")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({ voteDecision: "REJECT" })
      .expect(409);

    expect(res.body.code).toBe("DUPLICATE_VOTE");
  });

  it("POST /api/board/series/:id/votes requires BOARD or ADMIN role", async () => {
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

  it("POST /api/board/series/:id/decisions/tie-break requires EIC", async () => {
    await ProposalModel.create({
      id: "proposal-tie-test",
      title: "Tie Break Test",
      authorId: "u-mangaka",
      authorName: "Inoue Takehiko",
      synopsis: "Test",
      status: "TIE_BREAK",
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
          decision: "REJECT",
          createdAt: new Date(),
        },
      ],
      history: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const editor = await loginAs("editor@mangaflow.local");
    const res = await request(createApp())
      .post("/api/board/series/proposal-tie-test/decisions/tie-break")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({ voteDecision: "APPROVE" })
      .expect(403);

    expect(res.body.code).toBe("EIC_REQUIRED");
  });

  it("POST /api/board/series/:id/decisions/tie-break approval creates production series", async () => {
    await ProposalModel.create({
      id: "proposal-tie-approve-test",
      title: "Tie Approved Test",
      authorId: "u-mangaka",
      authorName: "Inoue Takehiko",
      synopsis: "Test",
      status: "TIE_BREAK",
      genres: ["Action"],
      requestedPublicationType: "MONTHLY",
      chaptersPlanned: 18,
      votes: [
        {
          memberId: "u-board-2",
          memberName: "Sato Eriko",
          decision: "APPROVE",
          createdAt: new Date(),
        },
        {
          memberId: "u-board-3",
          memberName: "Kobayashi Ren",
          decision: "REJECT",
          createdAt: new Date(),
        },
      ],
      history: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const eic = await loginAs("tanaka@beachread.jp");
    const res = await request(createApp())
      .post("/api/board/series/proposal-tie-approve-test/decisions/tie-break")
      .set("Authorization", `Bearer ${eic.accessToken}`)
      .send({ voteDecision: "APPROVE" })
      .expect(200);

    expect(res.body.data.status).toBe("APPROVED");
    const series = await SeriesModel.find({ proposalId: "proposal-tie-approve-test" }).lean();
    expect(series).toHaveLength(1);
    expect(series[0]).toMatchObject({
      cadence: "monthly",
      publicationType: "MONTHLY",
      targetChapters: 18,
      proposalId: "proposal-tie-approve-test",
    });
  });

  it("POST /api/board/series/:id/decisions/finalize works for BOARD", async () => {
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
    const res = await request(createApp())
      .post("/api/board/series/proposal-finalize-test/decisions/finalize")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({ decision: "APPROVED", publicationType: "WEEKLY" })
      .expect(200);

    expect(res.body.data.status).toBe("APPROVED");

    await request(createApp())
      .post("/api/board/series/proposal-finalize-test/decisions/finalize")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({ decision: "APPROVED", publicationType: "WEEKLY" })
      .expect(200);

    const series = await SeriesModel.find({ proposalId: "proposal-finalize-test" }).lean();
    expect(series).toHaveLength(1);
    expect(series[0]).toMatchObject({
      id: "s-proposal-finalize-test",
      title: "Finalize Test",
      status: "ONGOING",
      proposalId: "proposal-finalize-test",
      publicationType: "WEEKLY",
    });
  });

  it("POST /api/board/series/:id/decisions/finalize works for ADMIN", async () => {
    await ProposalModel.create({
      id: "proposal-finalize-admin",
      title: "Finalize Admin Test",
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

    const admin = await loginAs("admin@beachread.jp");
    const res = await request(createApp())
      .post("/api/board/series/proposal-finalize-admin/decisions/finalize")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({ decision: "REJECTED" })
      .expect(200);

    expect(res.body.data.status).toBe("REJECTED");
    const series = await SeriesModel.find({ proposalId: "proposal-finalize-admin" }).lean();
    expect(series).toHaveLength(0);
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

    expect(res.body.code).toBe("FORBIDDEN");
  });

  it("POST /api/board/series/:id/at-risk-decisions is audit-only", async () => {
    const admin = await loginAs("admin@beachread.jp");
    const res = await request(createApp())
      .post("/api/board/series/series-001/at-risk-decisions")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({ decision: "WARNING", note: "Test at-risk decision" })
      .expect(200);

    expect(res.body.data.seriesId).toBe("series-001");
    expect(res.body.data.decision).toBe("WARNING");
  });
});
