import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import { seedDatabase } from "../seed.js";
import {
  AuditEntryModel,
  ChapterModel,
  EarningModel,
  ProposalModel,
  RankingModel,
  SeriesModel,
  StudioCommentModel,
  StudioTaskModel,
} from "../db/models.js";
import { BOARD_QUORUM } from "../services/workflow.service.js";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  if (!mongoose.connection.db) throw new Error("Mongo connection is not ready.");
  await mongoose.connection.db.dropDatabase();
  await seedDatabase();
});

async function loginAs(email: string) {
  const res = await request(createApp()).post("/api/auth/login").send({ email, password: email });
  return res.body.data as { accessToken: string };
}

describe("Production-first completion hardening", () => {
  it("uses a production-safe board quorum by default", () => {
    expect(BOARD_QUORUM).toBeGreaterThanOrEqual(2);
  });

  it("blocks unrelated roles from comment mutation routes", async () => {
    await StudioCommentModel.create({
      id: "comment-rbac",
      taskId: "task-001",
      authorId: "u-assist",
      authorName: "Jun",
      text: "Needs cleanup",
      body: "Needs cleanup",
      status: "OPEN",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const board = await loginAs("board@beachread.jp");
    await request(createApp())
      .post("/api/comments")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({ taskId: "task-001", text: "Board should not comment here" })
      .expect(403);

    await request(createApp())
      .patch("/api/comments/comment-rbac")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({ text: "Board should not patch" })
      .expect(403);
  });

  it("blocks non-assignee assistant task actions", async () => {
    await StudioTaskModel.create({
      id: "task-rbac",
      title: "Protected task",
      assigneeId: "someone-else",
      assigneeName: "Other Assistant",
      status: "TODO",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const assistant = await loginAs("jun@beachread.jp");
    await request(createApp())
      .post("/api/studio/tasks/task-rbac/actions/START")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({})
      .expect(403);
  });

  it("returns pagination metadata for proposal lists", async () => {
    const editor = await loginAs("editor@mangaflow.local");
    const res = await request(createApp())
      .get("/api/proposals?page=1&pageSize=2")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeLessThanOrEqual(2);
    expect(res.body.pagination).toMatchObject({
      page: 1,
      pageSize: 2,
    });
    expect(res.body.meta).toMatchObject({
      sort: { field: "updatedAt", dir: "desc" },
    });
    expect(res.body.meta.summary.total).toBeGreaterThanOrEqual(res.body.data.length);
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(res.body.data.length);
    expect(res.body.pagination.totalPages).toBeGreaterThanOrEqual(1);
  });

  it("supports proposal list contract search, filters, and sort", async () => {
    await ProposalModel.create([
      {
        id: "proposal-list-alpha",
        title: "Alpha Proposal List Contract",
        authorId: "u-mangaka",
        authorName: "Inoue Takehiko",
        synopsis: "Searchable Alpha synopsis",
        status: "PENDING_EDITOR",
        requestedPublicationType: "WEEKLY",
        genres: ["Action"],
        votes: [],
        history: [],
        createdAt: new Date("2026-02-01T00:00:00.000Z"),
        updatedAt: new Date("2026-02-01T00:00:00.000Z"),
      },
      {
        id: "proposal-list-beta",
        title: "Beta Proposal List Contract",
        authorId: "u-mangaka",
        authorName: "Inoue Takehiko",
        synopsis: "Searchable Beta synopsis",
        status: "PENDING_BOARD",
        requestedPublicationType: "MONTHLY",
        genres: ["Drama"],
        votes: [],
        history: [],
        createdAt: new Date("2026-02-02T00:00:00.000Z"),
        updatedAt: new Date("2026-02-02T00:00:00.000Z"),
      },
      {
        id: "proposal-list-gamma",
        title: "Gamma Proposal List Contract",
        authorId: "u-mangaka",
        authorName: "Inoue Takehiko",
        synopsis: "Searchable Gamma synopsis",
        status: "PENDING_EDITOR",
        requestedPublicationType: "WEEKLY",
        genres: ["Comedy"],
        votes: [],
        history: [],
        createdAt: new Date("2026-02-03T00:00:00.000Z"),
        updatedAt: new Date("2026-02-03T00:00:00.000Z"),
      },
    ]);

    const editor = await loginAs("editor@mangaflow.local");
    const filters = encodeURIComponent(
      JSON.stringify({ status: { type: "select", value: "PENDING_EDITOR" } }),
    );
    const res = await request(createApp())
      .get(
        `/api/proposals?page=1&pageSize=1&q=Proposal%20List&sortBy=title&sortDir=asc&filters=${filters}`,
      )
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .expect(200);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe("proposal-list-alpha");
    expect(res.body.pagination).toMatchObject({
      page: 1,
      pageSize: 1,
      hasNextPage: true,
    });
    expect(res.body.meta.sort).toEqual({ field: "title", dir: "asc" });
    expect(res.body.meta.filters.status).toEqual({ type: "select", value: "PENDING_EDITOR" });
  });

  it("rejects unsupported proposal list sort fields", async () => {
    const editor = await loginAs("editor@mangaflow.local");
    const res = await request(createApp())
      .get("/api/proposals?sortBy=actions")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .expect(400);

    expect(res.body.code).toBe("INVALID_SORT_FIELD");
  });

  it("supports series list contract pagination, search, filters, and sort", async () => {
    await SeriesModel.create([
      {
        id: "series-list-alpha",
        slug: "series-list-alpha",
        title: "Alpha Production Contract",
        authorId: "u-mangaka",
        authorName: "Inoue Takehiko",
        editorId: "u-editor",
        editorName: "Tanaka Editor",
        synopsis: "Alpha production search",
        status: "ONGOING",
        publicationType: "WEEKLY",
        genres: ["Action"],
        assistantIds: [],
        createdAt: new Date("2026-03-01T00:00:00.000Z"),
        updatedAt: new Date("2026-03-01T00:00:00.000Z"),
      },
      {
        id: "series-list-beta",
        slug: "series-list-beta",
        title: "Beta Production Contract",
        authorId: "u-mangaka",
        authorName: "Inoue Takehiko",
        editorId: "u-editor",
        editorName: "Tanaka Editor",
        synopsis: "Beta production search",
        status: "HIATUS",
        publicationType: "MONTHLY",
        genres: ["Drama"],
        assistantIds: [],
        createdAt: new Date("2026-03-02T00:00:00.000Z"),
        updatedAt: new Date("2026-03-02T00:00:00.000Z"),
      },
      {
        id: "series-list-gamma",
        slug: "series-list-gamma",
        title: "Gamma Production Contract",
        authorId: "u-mangaka",
        authorName: "Inoue Takehiko",
        editorId: "u-editor",
        editorName: "Tanaka Editor",
        synopsis: "Gamma production search",
        status: "ONGOING",
        publicationType: "WEEKLY",
        genres: ["Comedy"],
        assistantIds: [],
        createdAt: new Date("2026-03-03T00:00:00.000Z"),
        updatedAt: new Date("2026-03-03T00:00:00.000Z"),
      },
    ]);

    const mangaka = await loginAs("inoue@beachread.jp");
    const filters = encodeURIComponent(
      JSON.stringify({ status: { type: "select", value: "ONGOING" } }),
    );
    const res = await request(createApp())
      .get(
        `/api/series?mine=true&page=1&pageSize=1&q=Production%20Contract&sortBy=title&sortDir=asc&filters=${filters}`,
      )
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .expect(200);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe("series-list-alpha");
    expect(res.body.pagination).toMatchObject({
      page: 1,
      pageSize: 1,
      hasNextPage: true,
    });
    expect(res.body.meta.sort).toEqual({ field: "title", dir: "asc" });
    expect(res.body.meta.filters.status).toEqual({ type: "select", value: "ONGOING" });
  });

  it("rejects unsupported series list sort fields", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const res = await request(createApp())
      .get("/api/series?sortBy=actions")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .expect(400);

    expect(res.body.code).toBe("INVALID_SORT_FIELD");
  });

  it("supports series chapter list contract pagination, search, filters, and sort", async () => {
    await ChapterModel.create([
      {
        id: "chapter-list-alpha",
        seriesId: "s-berserk-prod",
        number: 31,
        title: "Alpha Chapter Contract",
        status: "PLANNED",
        assigneeId: "u-mangaka",
        assigneeName: "Inoue Takehiko",
        pages: [],
        reviewNotes: [],
        history: [],
        createdAt: new Date("2026-04-01T00:00:00.000Z"),
        updatedAt: new Date("2026-04-01T00:00:00.000Z"),
      },
      {
        id: "chapter-list-beta",
        seriesId: "s-berserk-prod",
        number: 32,
        title: "Beta Chapter Contract",
        status: "EDITOR_REVIEW",
        assigneeId: "u-mangaka",
        assigneeName: "Inoue Takehiko",
        pages: [],
        reviewNotes: [],
        history: [],
        createdAt: new Date("2026-04-02T00:00:00.000Z"),
        updatedAt: new Date("2026-04-02T00:00:00.000Z"),
      },
      {
        id: "chapter-list-gamma",
        seriesId: "s-berserk-prod",
        number: 33,
        title: "Gamma Chapter Contract",
        status: "PLANNED",
        assigneeId: "u-mangaka",
        assigneeName: "Inoue Takehiko",
        pages: [],
        reviewNotes: [],
        history: [],
        createdAt: new Date("2026-04-03T00:00:00.000Z"),
        updatedAt: new Date("2026-04-03T00:00:00.000Z"),
      },
    ]);

    const mangaka = await loginAs("inoue@beachread.jp");
    const filters = encodeURIComponent(
      JSON.stringify({ status: { type: "select", value: "PLANNED" } }),
    );
    const res = await request(createApp())
      .get(
        `/api/series/s-berserk-prod/chapters?page=1&pageSize=1&q=Chapter%20Contract&sortBy=number&sortDir=asc&filters=${filters}`,
      )
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .expect(200);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe("chapter-list-alpha");
    expect(res.body.pagination).toMatchObject({
      page: 1,
      pageSize: 1,
      hasNextPage: true,
    });
    expect(res.body.meta.sort).toEqual({ field: "number", dir: "asc" });
    expect(res.body.meta.filters.status).toEqual({ type: "select", value: "PLANNED" });
  });

  it("rejects unsupported chapter list sort fields", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const res = await request(createApp())
      .get("/api/chapters?mine=true&sortBy=actions")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .expect(400);

    expect(res.body.code).toBe("INVALID_SORT_FIELD");
  });

  it("does not expose Board voting session endpoints in the MVP API", async () => {
    const board = await loginAs("board@beachread.jp");

    await request(createApp())
      .post("/api/voting-sessions")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({ title: "Live session", mode: "AD_HOC", proposalIds: ["p-001"] })
      .expect(404);

    await request(createApp())
      .get("/api/voting-sessions/legacy-session")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .expect(404);

    await request(createApp())
      .post("/api/voting-sessions/legacy-session/notes")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({ text: "Board packet is ready." })
      .expect(404);
  });

  it("returns scoped assistant earnings", async () => {
    await EarningModel.create({
      id: "earning-assistant-live",
      assistantId: "u-assist",
      period: "2026-06",
      amount: 12000,
      currency: "JPY",
      status: "PENDING",
      taskId: "task-001",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const assistant = await loginAs("jun@beachread.jp");
    const res = await request(createApp())
      .get("/api/assistant/earnings")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .expect(200);

    expect(res.body.data.some((earning: any) => earning.id === "earning-assistant-live")).toBe(
      true,
    );
    expect(res.body.data.every((earning: any) => earning.assistantId === "u-assist")).toBe(true);
  });

  it("does not expose non-user-management admin summaries in the MVP API", async () => {
    const admin = await loginAs("admin@beachread.jp");

    await request(createApp())
      .get("/api/admin/workflow-summary")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .expect(404);

    await request(createApp())
      .get("/api/admin/storage-summary")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .expect(404);
  });

  it("imports rankings through the live Board API and blocks unrelated roles", async () => {
    const assistant = await loginAs("jun@beachread.jp");
    await request(createApp())
      .post("/api/rankings/import")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({
        period: "2026-W27",
        source: "SURVEY",
        rows: [{ seriesId: "s-berserk-prod", score: 9.7, votes: 1200 }],
      })
      .expect(403);

    const board = await loginAs("board@beachread.jp");
    const res = await request(createApp())
      .post("/api/rankings/import")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({
        period: "2026-W27",
        source: "SURVEY",
        fileName: "manual-ranking.csv",
        rows: [{ seriesId: "s-berserk-prod", score: 9.7, votes: 1200 }],
      })
      .expect(201);

    expect(res.body.data).toMatchObject({
      period: "2026-W27",
      source: "SURVEY",
      imported: 1,
      rowCount: 1,
    });
    const imported = await RankingModel.findOne({
      seriesId: "s-berserk-prod",
      period: "2026-W27",
    }).lean() as any;
    expect(imported?.finalScore).toBe(9.7);
    expect(imported?.voteCount).toBe(1200);

    const audit = await AuditEntryModel.findOne({
      action: "RANKING_IMPORTED",
      entityType: "ranking_import",
    }).lean();
    expect(audit).toBeTruthy();
  });

  it("does not expose the legacy Board decision history aggregate", async () => {
    const board = await loginAs("board@beachread.jp");
    await request(createApp())
      .get("/api/board/decisions/history")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .expect(404);
  });
});
