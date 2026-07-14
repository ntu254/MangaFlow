import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import { seedDatabase } from "../seed.js";
import {
  ChapterModel,
  ProposalModel,
  PublicationModel,
  RankingModel,
  SeriesModel,
} from "../db/models.js";

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
    const res = await request(createApp())
      .post("/api/auth/login")
      .send({ email, password: email });
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
    expect(res.body.pagination).toMatchObject({
      page: 1,
      pageSize: 20,
    });
    expect(res.body.meta.summary.total).toBeGreaterThanOrEqual(1);
  });

  it("GET /api/board/queue supports MVP list contract pagination, search, filters, and sort", async () => {
    await ProposalModel.create([
      {
        id: "proposal-board-alpha",
        title: "Alpha Serialization Candidate",
        authorId: "u-mangaka",
        authorName: "Inoue Takehiko",
        synopsis: "Alpha synopsis",
        status: "PENDING_BOARD",
        requestedPublicationType: "WEEKLY",
        genres: ["Action"],
        votes: [],
        history: [],
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
      {
        id: "proposal-board-zeta",
        title: "Zeta Serialization Candidate",
        authorId: "u-mangaka",
        authorName: "Inoue Takehiko",
        synopsis: "Zeta synopsis",
        status: "TIE_BREAK",
        requestedPublicationType: "MONTHLY",
        genres: ["Drama"],
        votes: [],
        history: [],
        createdAt: new Date("2026-01-02T00:00:00.000Z"),
        updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      },
      {
        id: "proposal-board-beta",
        title: "Beta Serialization Candidate",
        authorId: "u-mangaka",
        authorName: "Inoue Takehiko",
        synopsis: "Beta synopsis",
        status: "PENDING_BOARD",
        requestedPublicationType: "WEEKLY",
        genres: ["Adventure"],
        votes: [],
        history: [],
        createdAt: new Date("2026-01-03T00:00:00.000Z"),
        updatedAt: new Date("2026-01-03T00:00:00.000Z"),
      },
    ]);

    const board = await loginAs("board@beachread.jp");
    const filters = encodeURIComponent(
      JSON.stringify({ status: { type: "select", value: "PENDING_BOARD" } }),
    );
    const res = await request(createApp())
      .get(
        `/api/board/queue?page=1&pageSize=1&q=Serialization&sortBy=title&sortDir=asc&filters=${filters}`,
      )
      .set("Authorization", `Bearer ${board.accessToken}`)
      .expect(200);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe("proposal-board-alpha");
    expect(res.body.pagination).toMatchObject({
      page: 1,
      pageSize: 1,
      hasNextPage: true,
    });
    expect(res.body.meta.sort).toEqual({ field: "title", dir: "asc" });
    expect(res.body.meta.filters.status).toEqual({
      type: "select",
      value: "PENDING_BOARD",
    });
  });

  it("GET /api/board/queue rejects unsupported sort fields", async () => {
    const board = await loginAs("board@beachread.jp");
    const res = await request(createApp())
      .get("/api/board/queue?sortBy=actions")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .expect(400);

    expect(res.body.code).toBe("INVALID_SORT_FIELD");
  });

  it("GET /api/board/queue requires Board role", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    await request(createApp())
      .get("/api/board/queue")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .expect(403);
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

  it("GET /api/board/proposals/:id/votes returns votes and tally", async () => {
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
      .get("/api/board/proposals/proposal-votes-test/votes")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .expect(200);

    expect(res.body.data.seriesId).toBe("proposal-votes-test");
    expect(Array.isArray(res.body.data.votes)).toBe(true);
    expect(res.body.data.votes.length).toBe(2);
    expect(res.body.data.tally).toBeDefined();
    expect(res.body.data.tally.approve).toBe(2);
  });

  it("POST /api/board/proposals/:id/votes casts vote and reaches quorum", async () => {
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
      .post("/api/board/proposals/proposal-quorum-test/votes")
      .set("Authorization", `Bearer ${board3.accessToken}`)
      .send({ voteDecision: "APPROVE" })
      .expect(200);

    expect(res.body.data.status).toBe("APPROVED");

    const series = await SeriesModel.find({
      proposalId: "proposal-quorum-test",
    }).lean();
    expect(series).toHaveLength(0);
  });

  it("POST /api/board/proposals/:id/votes rejects duplicate vote with DUPLICATE_VOTE", async () => {
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
      .post("/api/board/proposals/proposal-dup-test/votes")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({ voteDecision: "REJECT" })
      .expect(409);

    expect(res.body.code).toBe("DUPLICATE_VOTE");
  });

  it("POST /api/board/proposals/:id/votes requires BOARD or ADMIN role", async () => {
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
      .post("/api/board/proposals/proposal-rbac-test/votes")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({ voteDecision: "APPROVE" })
      .expect(403);
  });

  it("POST /api/board/proposals/:id/tie-break requires EIC", async () => {
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
      .post("/api/board/proposals/proposal-tie-test/tie-break")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({ voteDecision: "APPROVE" })
      .expect(403);

    expect(res.body.code).toBe("EIC_REQUIRED");
  });

  it("POST /api/board/proposals/:id/tie-break approval creates production series", async () => {
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
      .post("/api/board/proposals/proposal-tie-approve-test/tie-break")
      .set("Authorization", `Bearer ${eic.accessToken}`)
      .send({ voteDecision: "APPROVE" })
      .expect(200);

    expect(res.body.data.status).toBe("APPROVED");
    const series = await SeriesModel.find({
      proposalId: "proposal-tie-approve-test",
    }).lean();
    expect(series).toHaveLength(0);
  });

  it("POST /api/board/proposals/:id/finalization works for BOARD", async () => {
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
      .post("/api/board/proposals/proposal-finalize-test/finalization")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({
        decision: "APPROVED",
        publicationType: "WEEKLY",
        tantouEditorId: "u-editor",
      })
      .expect(200);

    expect(res.body.data.status).toBe("APPROVED");

    await request(createApp())
      .post("/api/board/proposals/proposal-finalize-test/finalization")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({
        decision: "APPROVED",
        publicationType: "WEEKLY",
        tantouEditorId: "u-editor",
      })
      .expect(200);

    const series = await SeriesModel.find({
      proposalId: "proposal-finalize-test",
    }).lean();
    expect(series).toHaveLength(1);
    expect(series[0]).toMatchObject({
      id: "s-proposal-finalize-test",
      title: "Finalize Test",
      status: "ONGOING",
      proposalId: "proposal-finalize-test",
      publicationType: "WEEKLY",
      editorId: "u-editor",
    });
  });

  it("POST /api/board/proposals/:proposalId/votes casts a Board vote through the explicit MVP command", async () => {
    await ProposalModel.create({
      id: "proposal-command-vote",
      title: "Explicit Vote Command",
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
      .post("/api/board/proposals/proposal-command-vote/votes")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({ voteDecision: "APPROVE", comment: "Ready for serialization." })
      .expect(200);

    expect(res.body.data.status).toBe("BOARD_VOTING");
    expect(res.body.data.votes).toHaveLength(1);
    expect(res.body.data.votes[0]).toMatchObject({
      memberId: "u-board",
      decision: "APPROVE",
      comment: "Ready for serialization.",
    });
  });

  it("POST /api/board/proposals/:proposalId/finalization creates Series only after Tantou and cadence are selected", async () => {
    await ProposalModel.create({
      id: "proposal-command-finalize",
      title: "Explicit Finalize Command",
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

    await request(createApp())
      .post("/api/board/proposals/proposal-command-finalize/finalization")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({ decision: "APPROVED", publicationType: "WEEKLY" })
      .expect(400);

    const res = await request(createApp())
      .post("/api/board/proposals/proposal-command-finalize/finalization")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({
        decision: "APPROVED",
        publicationType: "WEEKLY",
        tantouEditorId: "u-editor",
      })
      .expect(200);

    expect(res.body.data.status).toBe("APPROVED");

    const series = await SeriesModel.find({
      proposalId: "proposal-command-finalize",
    }).lean();
    expect(series).toHaveLength(1);
    expect(series[0]).toMatchObject({
      id: "s-proposal-command-finalize",
      publicationType: "WEEKLY",
      editorId: "u-editor",
    });
  });

  it("POST /api/board/proposals/:id/finalization works for ADMIN", async () => {
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
      .post("/api/board/proposals/proposal-finalize-admin/finalization")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({ decision: "REJECTED" })
      .expect(200);

    expect(res.body.data.status).toBe("REJECTED");
    const series = await SeriesModel.find({
      proposalId: "proposal-finalize-admin",
    }).lean();
    expect(series).toHaveLength(0);
  });

  it("POST /api/board/proposals/:id/finalization blocks ASSISTANT", async () => {
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
      .post("/api/board/proposals/proposal-finalize-assistant/finalization")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({ decision: "APPROVED" })
      .expect(403);

    expect(res.body.code).toBe("FORBIDDEN");
  });

  it("POST /api/board/series/:id/at-risk-decisions requires a submitted Tantou report", async () => {
    const board = await loginAs("board@beachread.jp");
    const res = await request(createApp())
      .post("/api/board/series/s-berserk-prod/at-risk-decisions")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({ decision: "HIATUS", note: "Rankings dropped" })
      .expect(409);

    expect(res.body.code).toBe("AT_RISK_REPORT_REQUIRED");
  });

  it("Tantou Editor can submit an at-risk report and Board can view the latest report", async () => {
    const tantou = await loginAs("tanaka@beachread.jp");
    const board = await loginAs("board@beachread.jp");

    const res = await request(createApp())
      .post("/api/series/s-berserk-prod/at-risk-reports")
      .set("Authorization", `Bearer ${tantou.accessToken}`)
      .send({
        rankingSummary: "Final score fell below the serialization threshold.",
        recommendation: "HIATUS",
        notes: "Production recovery needs a short pause.",
      })
      .expect(201);

    expect(res.body.data.status).toBe("SUBMITTED");
    expect(res.body.data.editorId).toBe("u-editor");

    const latest = await request(createApp())
      .get("/api/series/s-berserk-prod/at-risk-reports/latest")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .expect(200);

    expect(latest.body.data.id).toBe(res.body.data.id);
    expect(latest.body.data.recommendation).toBe("HIATUS");
  });

  it("rejects Mangaka and non-Tantou Editor at-risk report submissions", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const otherEditor = await loginAs("editor@mangaflow.local");

    await request(createApp())
      .post("/api/series/s-berserk-prod/at-risk-reports")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ rankingSummary: "Risk data", recommendation: "CONTINUE" })
      .expect(403);

    const res = await request(createApp())
      .post("/api/series/s-berserk-prod/at-risk-reports")
      .set("Authorization", `Bearer ${otherEditor.accessToken}`)
      .send({ rankingSummary: "Risk data", recommendation: "CONTINUE" })
      .expect(403);

    expect(res.body.code).toBe("NOT_TANTOU_EDITOR");
  });

  it("POST /api/board/series/:id/at-risk-decisions transitions the series after report (HIATUS)", async () => {
    const tantou = await loginAs("tanaka@beachread.jp");
    const board = await loginAs("board@beachread.jp");
    await request(createApp())
      .post("/api/series/s-berserk-prod/at-risk-reports")
      .set("Authorization", `Bearer ${tantou.accessToken}`)
      .send({ rankingSummary: "Rankings dropped.", recommendation: "HIATUS" })
      .expect(201);

    const res = await request(createApp())
      .post("/api/board/series/s-berserk-prod/at-risk-decisions")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({ decision: "HIATUS", note: "Rankings dropped" })
      .expect(200);

    expect(res.body.data.status).toBe("HIATUS");
  });

  it("POST /api/board/series/:id/at-risk-decisions can cancel the series after report", async () => {
    const tantou = await loginAs("tanaka@beachread.jp");
    const board = await loginAs("board@beachread.jp");
    await request(createApp())
      .post("/api/series/s-berserk-prod/at-risk-reports")
      .set("Authorization", `Bearer ${tantou.accessToken}`)
      .send({
        rankingSummary: "Cancellation threshold hit.",
        recommendation: "CANCELLED",
      })
      .expect(201);

    const res = await request(createApp())
      .post("/api/board/series/s-berserk-prod/at-risk-decisions")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({ decision: "CANCELLED", note: "Discontinued" })
      .expect(200);

    expect(res.body.data.status).toBe("CANCELLED");
  });

  it("POST /api/board/series/:id/at-risk-decisions rejects an invalid decision", async () => {
    const admin = await loginAs("admin@beachread.jp");
    await request(createApp())
      .post("/api/board/series/s-berserk-prod/at-risk-decisions")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({ decision: "WARNING" })
      .expect(400);
  });

  it("POST /api/board/series/:id/at-risk-decisions returns 404 for unknown series", async () => {
    const admin = await loginAs("admin@beachread.jp");
    await request(createApp())
      .post("/api/board/series/series-001/at-risk-decisions")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({ decision: "CONTINUE" })
      .expect(404);
  });

  it("Tantou Editor schedules publication through explicit MVP publication command", async () => {
    await ChapterModel.create({
      id: "chapter-publication-command",
      seriesId: "s-berserk-prod",
      number: 99,
      title: "Publication Command",
      status: "READY_FOR_PUBLICATION",
      pages: [],
      reviewNotes: [],
      history: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const editor = await loginAs("tanaka@beachread.jp");
    const scheduledAt = new Date(
      Date.now() + 48 * 60 * 60 * 1000,
    ).toISOString();
    const res = await request(createApp())
      .post("/api/chapters/chapter-publication-command/publication/schedule")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({ scheduledAt })
      .expect(200);

    expect(res.body.data.status).toBe("READY_FOR_PUBLICATION");

    const publication = await PublicationModel.findOne({
      chapterId: "chapter-publication-command",
    }).lean();
    expect(publication).toMatchObject({
      status: "SCHEDULED",
      scheduledById: "u-editor",
    });
    expect(new Date((publication as any).scheduledAt).toISOString()).toBe(
      scheduledAt,
    );
  });
});
