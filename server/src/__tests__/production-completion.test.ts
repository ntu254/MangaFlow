import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import { seedDatabase } from "../seed.js";
import {
  AuditEntryModel,
  EarningModel,
  ProposalModel,
  RankingModel,
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
      .get("/api/proposals?page=1&limit=2")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeLessThanOrEqual(2);
    expect(res.body.pagination).toMatchObject({
      page: 1,
      pageSize: 2,
      limit: 2,
    });
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(res.body.data.length);
    expect(res.body.pagination.totalPages).toBeGreaterThanOrEqual(1);
  });

  it("returns scoped assistant earnings", async () => {
    await EarningModel.create({
      id: "earning-assistant-live",
      assistantId: "u-assist",
      period: "2026-06",
      amount: 12000,
      currency: "JPY",
      status: "CONFIRMED",
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

  it("returns a Board decision history read model", async () => {
    await ProposalModel.create({
      id: "proposal-decision-history",
      title: "Decision History Proposal",
      authorId: "u-mangaka",
      authorName: "Inoue Takehiko",
      synopsis: "Already approved",
      status: "APPROVED",
      votes: [],
      history: [],
      createdAt: new Date(),
      updatedAt: new Date("2026-06-01T10:00:00.000Z"),
    });

    await RankingModel.create({
      id: "rank-decision-history",
      seriesId: "s-berserk-prod",
      seriesTitle: "Berserk: Lost Chapters",
      period: "2026-W27",
      readerScore: 4.2,
      voteCount: 100,
      finalScore: 4.2,
      status: "AT_RISK",
      atRisk: true,
      createdAt: new Date(),
      updatedAt: new Date("2026-06-02T10:00:00.000Z"),
    });

    const board = await loginAs("board@beachread.jp");
    const res = await request(createApp())
      .get("/api/board/decisions/history")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.some((row: any) => row.type === "Proposal" && row.id === "proposal-decision-history")).toBe(true);
    expect(res.body.data.some((row: any) => row.type === "At-risk" && row.id === "rank-decision-history")).toBe(true);
  });
});
