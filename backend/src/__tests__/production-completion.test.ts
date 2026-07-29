import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import { vi } from "vitest";
import { createApp } from "../app.js";
import { seedDatabase } from "../seed.js";
import {
  AuditEntryModel,
  EarningModel,
  ProposalModel,
  RankingModel,
  StudioCommentModel,
  StudioTaskModel,
  VotingSessionModel,
} from "../db/models.js";
import { BOARD_QUORUM } from "../services/board-governance.service.js";

let mongo: MongoMemoryReplSet;

beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
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
  it("uses the canonical three-vote Board quorum", () => {
    // BOARD_QUORUM is a fixed constant (3) — env override was removed with the
    // majority-voting refactor, so a single Board member can never decide a
    // proposal. See backend/src/services/workflow.service.ts.
    expect(BOARD_QUORUM).toBe(3);
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

  it("supports live voting session detail and notes", async () => {
    const board = await loginAs("board@beachread.jp");
    await ProposalModel.create({
      id: "p-live-session-notes",
      slug: "p-live-session-notes",
      title: "Live session proposal",
      authorId: "u-mangaka",
      authorName: "Inoue Takehiko",
      status: "PENDING_BOARD",
    });
    const created = await request(createApp())
      .post("/api/voting-sessions")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({ title: "Live session", mode: "AD_HOC", proposalIds: ["p-live-session-notes"] })
      .expect(201);

    const sessionId = created.body.data.id;
    const detail = await request(createApp())
      .get(`/api/voting-sessions/${sessionId}`)
      .set("Authorization", `Bearer ${board.accessToken}`)
      .expect(200);
    expect(detail.body.data.title).toBe("Live session");

    const note = await request(createApp())
      .post(`/api/voting-sessions/${sessionId}/notes`)
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({ text: "Board packet is ready." })
      .expect(201);

    expect(note.body.data.text).toBe("Board packet is ready.");
    const afterNote = (await VotingSessionModel.findOne({ id: sessionId }).lean()) as any;
    expect(afterNote?.notes).toHaveLength(1);

    await request(createApp())
      .patch(`/api/voting-sessions/${sessionId}/notes/${note.body.data.id}`)
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({ text: "Board packet confirmed." })
      .expect(200);
  });

  it("keeps notes immutable after a real voting session is tied", async () => {
    const board = await loginAs("board@beachread.jp");
    await ProposalModel.create({
      id: "p-terminal-session-notes",
      slug: "p-terminal-session-notes",
      title: "Terminal session proposal",
      authorId: "u-mangaka",
      authorName: "Inoue Takehiko",
      status: "PENDING_BOARD",
    });
    const created = await request(createApp())
      .post("/api/voting-sessions")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({
        title: "Terminal session",
        mode: "AD_HOC",
        proposalIds: ["p-terminal-session-notes"],
      })
      .expect(201);
    const sessionId = created.body.data.id;
    const note = await request(createApp())
      .post(`/api/voting-sessions/${sessionId}/notes`)
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({ text: "This must remain in the audit history." })
      .expect(201);

    await VotingSessionModel.updateOne({ id: sessionId }, { $set: { status: "TIED" } });

    await request(createApp())
      .patch(`/api/voting-sessions/${sessionId}/notes/${note.body.data.id}`)
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({ text: "This edit must be rejected." })
      .expect(409)
      .expect((res) => expect(res.body.code).toBe("SESSION_CLOSED"));

    await request(createApp())
      .delete(`/api/voting-sessions/${sessionId}/notes/${note.body.data.id}`)
      .set("Authorization", `Bearer ${board.accessToken}`)
      .expect(409)
      .expect((res) => expect(res.body.code).toBe("SESSION_CLOSED"));

    const terminalSession = (await VotingSessionModel.findOne({ id: sessionId }).lean()) as any;
    expect(terminalSession.notes).toEqual([
      expect.objectContaining({
        id: note.body.data.id,
        text: "This must remain in the audit history.",
      }),
    ]);
  });

  it.each(["PATCH", "DELETE"] as const)(
    "rejects note %s when the session closes immediately before the atomic mutation",
    async (method) => {
      const board = await loginAs("board@beachread.jp");
      await ProposalModel.create({
        id: `p-note-${method.toLowerCase()}-race`,
        slug: `p-note-${method.toLowerCase()}-race`,
        title: "Note mutation race proposal",
        authorId: "u-mangaka",
        authorName: "Inoue Takehiko",
        status: "PENDING_BOARD",
      });
      const created = await request(createApp())
        .post("/api/voting-sessions")
        .set("Authorization", `Bearer ${board.accessToken}`)
        .send({
          title: "Note mutation race",
          mode: "AD_HOC",
          proposalIds: [`p-note-${method.toLowerCase()}-race`],
        })
        .expect(201);
      const sessionId = created.body.data.id;
      const note = await request(createApp())
        .post(`/api/voting-sessions/${sessionId}/notes`)
        .set("Authorization", `Bearer ${board.accessToken}`)
        .send({ text: "Do not mutate this note after close." })
        .expect(201);

      const findOneAndUpdate = VotingSessionModel.findOneAndUpdate.bind(VotingSessionModel);
      const closeBeforeMutation = vi
        .spyOn(VotingSessionModel, "findOneAndUpdate")
        .mockImplementationOnce((...args: any[]) => {
          const query = findOneAndUpdate(...args) as any;
          const lean = query.lean.bind(query);
          query.lean = async (...leanArgs: any[]) => {
            await VotingSessionModel.updateOne({ id: sessionId }, { $set: { status: "TIED" } });
            return lean(...leanArgs);
          };
          return query;
        });

      try {
        const mutation = request(createApp())
          [method === "PATCH" ? "patch" : "delete"](
            `/api/voting-sessions/${sessionId}/notes/${note.body.data.id}`,
          )
          .set("Authorization", `Bearer ${board.accessToken}`);
        if (method === "PATCH") mutation.send({ text: "This race must be rejected." });

        await mutation.expect(409).expect((res) => expect(res.body.code).toBe("SESSION_CLOSED"));
      } finally {
        closeBeforeMutation.mockRestore();
      }

      const terminalSession = (await VotingSessionModel.findOne({ id: sessionId }).lean()) as any;
      expect(terminalSession.status).toBe("TIED");
      expect(terminalSession.notes).toEqual([
        expect.objectContaining({
          id: note.body.data.id,
          text: "Do not mutate this note after close.",
        }),
      ]);
    },
  );

  it("keeps missing-session, missing-note, and wrong-author note mutation responses distinct", async () => {
    const author = await loginAs("board@beachread.jp");
    const otherBoardMember = await loginAs("sato@beachread.jp");
    await ProposalModel.create({
      id: "p-note-mutation-semantics",
      slug: "p-note-mutation-semantics",
      title: "Note mutation semantics proposal",
      authorId: "u-mangaka",
      authorName: "Inoue Takehiko",
      status: "PENDING_BOARD",
    });
    const created = await request(createApp())
      .post("/api/voting-sessions")
      .set("Authorization", `Bearer ${author.accessToken}`)
      .send({
        title: "Note mutation semantics",
        mode: "AD_HOC",
        proposalIds: ["p-note-mutation-semantics"],
      })
      .expect(201);
    const sessionId = created.body.data.id;
    const note = await request(createApp())
      .post(`/api/voting-sessions/${sessionId}/notes`)
      .set("Authorization", `Bearer ${author.accessToken}`)
      .send({ text: "Only the author may change this note." })
      .expect(201);

    await request(createApp())
      .patch(`/api/voting-sessions/missing-session/notes/${note.body.data.id}`)
      .set("Authorization", `Bearer ${author.accessToken}`)
      .send({ text: "Missing session." })
      .expect(404)
      .expect((res) => expect(res.body.code).toBe("SESSION_NOT_FOUND"));

    await request(createApp())
      .patch(`/api/voting-sessions/${sessionId}/notes/missing-note`)
      .set("Authorization", `Bearer ${author.accessToken}`)
      .send({ text: "Missing note." })
      .expect(404)
      .expect((res) => expect(res.body.code).toBe("NOTE_NOT_FOUND"));

    await request(createApp())
      .delete(`/api/voting-sessions/${sessionId}/notes/${note.body.data.id}`)
      .set("Authorization", `Bearer ${otherBoardMember.accessToken}`)
      .expect(403)
      .expect((res) => expect(res.body.code).toBe("FORBIDDEN"));
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

  it("returns admin workflow and storage summaries", async () => {
    await ProposalModel.create({
      id: "proposal-admin-summary",
      title: "Admin Summary Proposal",
      authorId: "u-mangaka",
      authorName: "Inoue Takehiko",
      synopsis: "Needs board",
      status: "TIE_BREAK",
      votes: [],
      history: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const admin = await loginAs("admin@beachread.jp");
    const workflow = await request(createApp())
      .get("/api/admin/workflow-summary")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .expect(200);
    expect(workflow.body.data.counts.highRisk).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(workflow.body.data.issues)).toBe(true);

    const storage = await request(createApp())
      .get("/api/admin/storage-summary")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .expect(200);
    expect(storage.body.data).toHaveProperty("indexedAssets");
    expect(Array.isArray(storage.body.data.assets)).toBe(true);
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
    const imported = (await RankingModel.findOne({
      seriesId: "s-berserk-prod",
      period: "2026-W27",
    }).lean()) as any;
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

    await VotingSessionModel.create({
      id: "vs-decision-history",
      title: "Closed decision session",
      mode: "AD_HOC",
      status: "CLOSED",
      proposalIds: ["proposal-decision-history"],
      createdById: "u-board",
      createdByName: "Yamamoto Director",
      openedAt: new Date("2026-06-01T09:00:00.000Z"),
      closedAt: new Date("2026-06-01T11:00:00.000Z"),
      outcomes: [{ proposalId: "proposal-decision-history", decision: "APPROVED" }],
      notes: [],
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
    expect(
      res.body.data.some(
        (row: any) => row.type === "Proposal" && row.id === "proposal-decision-history",
      ),
    ).toBe(true);
    expect(
      res.body.data.some((row: any) => row.type === "Session" && row.id === "vs-decision-history"),
    ).toBe(true);
    expect(
      res.body.data.some(
        (row: any) => row.type === "At-risk" && row.id === "rank-decision-history",
      ),
    ).toBe(true);
  });
});
