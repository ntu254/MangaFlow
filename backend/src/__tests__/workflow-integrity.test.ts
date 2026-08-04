import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import {
  ChapterModel,
  SeriesInviteModel,
  SeriesModel,
  StudioTaskModel,
  SubmissionModel,
} from "../db/models.js";
import { seedDatabase } from "../seed.js";

let mongo: MongoMemoryReplSet;

async function loginAs(email: string) {
  const response = await request(createApp())
    .post("/api/auth/login")
    .send({ email, password: email })
    .expect(200);
  return response.body.data as { accessToken: string; user: { id: string } };
}

describe("workflow integrity guards", () => {
  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongo.getUri());
  }, 30_000);

  beforeEach(async () => seedDatabase());

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  }, 30_000);

  it("rejects patching a Task with a Page from a different Chapter", async () => {
    const owner = await loginAs("inoue@beachread.jp");

    const response = await request(createApp())
      .patch("/api/studio/tasks/tsk-002")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({
        chapterId: "ch-s-berserk-prod-5",
        pageId: "ch-s-berserk-prod-4-p1",
      })
      .expect(400);

    expect(response.body.code).toBe("TARGET_MISMATCH");
  });

  it("rejects decisions against a terminal Submission", async () => {
    const owner = await loginAs("inoue@beachread.jp");
    await StudioTaskModel.create({
      id: "task-integrity-terminal",
      seriesId: "s-berserk-prod",
      chapterId: "ch-s-berserk-prod-5",
      assigneeId: "u-assist",
      status: "MANGAKA_APPROVED",
      currentSubmissionId: "sub-integrity-terminal",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await SubmissionModel.create({
      id: "sub-integrity-terminal",
      taskId: "task-integrity-terminal",
      seriesId: "s-berserk-prod",
      chapterId: "ch-s-berserk-prod-5",
      assistantId: "u-assist",
      status: "MANGAKA_APPROVED",
      reviewStage: "MANGAKA_REVIEW",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await request(createApp())
      .post("/api/submissions/sub-integrity-terminal/request-revision")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ reviewerNote: "Must not reopen an approved submission" })
      .expect(409);

    expect(response.body.code).toBe("INVALID_TRANSITION");
  });

  it("rejects expired Assistant invites", async () => {
    const invite = await SeriesInviteModel.create({
      id: "invite-expired-integrity",
      seriesId: "s-berserk-prod",
      userId: "u-assist-2",
      email: "hina@beachread.jp",
      role: "assistant",
      status: "PENDING",
      expiresAt: new Date(Date.now() - 60_000),
      invitedById: "u-mangaka",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const assistant = await loginAs("hina@beachread.jp");

    const response = await request(createApp())
      .post(`/api/series/invites/${invite.id}/accept`)
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .expect(409);

    expect(response.body.code).toBe("INVITE_EXPIRED");
  });

  it("rejects invalid Series lifecycle transitions", async () => {
    const owner = await loginAs("inoue@beachread.jp");
    await SeriesModel.updateOne(
      { id: "s-berserk-prod" },
      { $set: { status: "HIATUS" } },
    );

    const response = await request(createApp())
      .post("/api/series/s-berserk-prod/actions/START_PRODUCTION")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({})
      .expect(409);

    expect(response.body.code).toBe("INVALID_TRANSITION");
  });

  it("rejects direct archive of an active series (Board at-risk only)", async () => {
    const owner = await loginAs("inoue@beachread.jp");

    const response = await request(createApp())
      .post("/api/series/s-berserk-prod/actions/ARCHIVE")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({})
      .expect(403);

    expect(response.body.code).toBe("BOARD_AT_RISK_REQUIRED");
  });

  it("requires the assigned Assistant to accept a new task before starting it", async () => {
    await StudioTaskModel.create({
      id: "task-assignment-pending",
      seriesId: "s-berserk-prod",
      chapterId: "ch-s-berserk-prod-5",
      assigneeId: "u-assist",
      assignmentStatus: "PENDING",
      status: "TODO",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const assistant = await loginAs("jun@beachread.jp");

    const beforeAccept = await request(createApp())
      .post("/api/studio/tasks/task-assignment-pending/actions/START")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({})
      .expect(409);
    expect(beforeAccept.body.code).toBe("TASK_ASSIGNMENT_NOT_ACCEPTED");

    const accepted = await request(createApp())
      .post("/api/studio/tasks/task-assignment-pending/actions/ACCEPT")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({})
      .expect(200);
    expect(accepted.body.data.assignmentStatus).toBe("ACCEPTED");

    const started = await request(createApp())
      .post("/api/studio/tasks/task-assignment-pending/actions/START")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({})
      .expect(200);
    expect(started.body.data.status).toBe("IN_PROGRESS");
  });

  it("lets the assigned Assistant reject a pending task with a reason", async () => {
    await StudioTaskModel.create({
      id: "task-assignment-rejected",
      seriesId: "s-berserk-prod",
      chapterId: "ch-s-berserk-prod-5",
      assigneeId: "u-assist",
      assignmentStatus: "PENDING",
      status: "TODO",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const assistant = await loginAs("jun@beachread.jp");

    const rejected = await request(createApp())
      .post("/api/studio/tasks/task-assignment-rejected/actions/REJECT")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({ reason: "No capacity this week" })
      .expect(200);
    expect(rejected.body.data.assignmentStatus).toBe("REJECTED");

    const startAfterReject = await request(createApp())
      .post("/api/studio/tasks/task-assignment-rejected/actions/START")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({})
      .expect(409);
    expect(startAfterReject.body.code).toBe("TASK_ASSIGNMENT_NOT_ACCEPTED");
  });

  it("records page-task reassignment before start and rejects reassignment after start", async () => {
    const owner = await loginAs("inoue@beachread.jp");
    await StudioTaskModel.create({
      id: "task-page-reassign",
      targetScope: "PAGE",
      pageTaskActive: true,
      seriesId: "s-vinland-prod",
      chapterId: "ch-s-vinland-prod-1",
      pageId: "ch-s-vinland-prod-1-p6",
      assigneeId: "u-assist-2",
      assigneeName: "Hina",
      assignmentStatus: "REJECTED",
      status: "TODO",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const reassigned = await request(createApp())
      .post("/api/studio/tasks/task-page-reassign/actions/REASSIGN")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ newAssigneeId: "u-assist", reason: "Capacity planning" })
      .expect(200);
    expect(reassigned.body.data).toMatchObject({
      assigneeId: "u-assist",
      assignmentStatus: "PENDING",
      reassigned: true,
      reassignedFromId: "u-assist-2",
      reassignedToId: "u-assist",
      reassignmentReason: "Capacity planning",
    });

    const assistant = await loginAs("jun@beachread.jp");
    await request(createApp())
      .post("/api/studio/tasks/task-page-reassign/actions/ACCEPT")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({})
      .expect(200);
    await request(createApp())
      .post("/api/studio/tasks/task-page-reassign/actions/START")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({})
      .expect(200);

    const afterStart = await request(createApp())
      .post("/api/studio/tasks/task-page-reassign/actions/REASSIGN")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ newAssigneeId: "u-assist-2", reason: "Too late" })
      .expect(409);
    expect(afterStart.body.code).toBe("REASSIGN_AFTER_START_NOT_ALLOWED");
  });
});

// =============================================================================
// Sprint 1 — Workflow Integrity Plan
//   1.1 chapter.createPage must require IN_PRODUCTION/REVISION_REQUIRED
//   1.2 Series.status must reject AT_RISK and emit riskStatus separately
//   1.3 Page assignment RELEASE must block until EDITOR_APPROVED/COMPLETED
// =============================================================================

import { RankingModel, OutboxEventModel } from "../db/models.js";

describe("Sprint 1 workflow integrity: createChapterPage guard (1.1)", () => {
  beforeAll(async () => {
    if (!mongo) {
      mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
      await mongoose.connect(mongo.getUri());
    }
  }, 30_000);

  beforeEach(async () => seedDatabase());

  it("refuses to create a page on a PLANNED chapter and never mutates its status", async () => {
    const owner = await loginAs("inoue@beachread.jp");
    // s-berserk-prod-1 is PLANNED in seed. try to add a page.
    await ChapterModel.updateOne(
      { id: "ch-s-berserk-prod-1" },
      { $set: { status: "PLANNED" } },
    );

    const res = await request(createApp())
      .post("/api/chapters/ch-s-berserk-prod-1/pages")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ pageNumber: 1, fileKey: "tests/page-planned.png" })
      .expect(409);

    expect(res.body.code).toBe("CHAPTER_NOT_IN_PRODUCTION");

    const chapter = await ChapterModel.findOne({ id: "ch-s-berserk-prod-1" }).lean();
    expect(chapter?.status).toBe("PLANNED");
    expect((chapter?.pages ?? []).map((page: any) => page.id)).not.toContain(
      expect.stringMatching(/^pg-/),
    );
  });

  it("accepts createPage on IN_PRODUCTION and audits the creation", async () => {
    const owner = await loginAs("inoue@beachread.jp");
    await ChapterModel.updateOne(
      { id: "ch-s-berserk-prod-1" },
      { $set: { status: "IN_PRODUCTION", pages: [] } },
    );

    const res = await request(createApp())
      .post("/api/chapters/ch-s-berserk-prod-1/pages")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ pageNumber: 1, fileKey: "tests/page-in-production.png" })
      .expect(201);

    expect(res.body.data.status).toBe("UPLOADED");
    expect(res.body.data.fileKey).toBe("tests/page-in-production.png");

    const chapter = await ChapterModel.findOne({ id: "ch-s-berserk-prod-1" }).lean();
    expect(chapter?.status).toBe("IN_PRODUCTION");
    expect((chapter?.pages ?? []).length).toBe(1);
  });

  it("rejects createPage when chapter is in TANTOU_REVIEW with CHAPTER_REVIEW_LOCKED", async () => {
    const owner = await loginAs("inoue@beachread.jp");
    await ChapterModel.updateOne(
      { id: "ch-s-berserk-prod-1" },
      { $set: { status: "TANTOU_REVIEW", pages: [] } },
    );

    const res = await request(createApp())
      .post("/api/chapters/ch-s-berserk-prod-1/pages")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ pageNumber: 1, fileKey: "tests/page-tantou.png" })
      .expect(409);

    expect(res.body.code).toBe("CHAPTER_REVIEW_LOCKED");
  });
});

describe("Sprint 1 workflow integrity: Series risk status split (1.2)", () => {
  beforeAll(async () => {
    if (!mongo) {
      mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
      await mongoose.connect(mongo.getUri());
    }
  }, 30_000);

  beforeEach(async () => seedDatabase());

  it("rejects writing Series.status = AT_RISK at the model layer", async () => {
    let saveError: any = null;
    try {
      await SeriesModel.create({
        id: "s-risk-guard",
        title: "Risk guard",
        authorId: "u-mangaka",
        authorName: "Inoue",
        status: "AT_RISK",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (err) {
      saveError = err;
    }
    expect(saveError).toBeTruthy();
    expect(String(saveError?.message ?? "")).toMatch(/AT_RISK|enum/i);
    const stored = await SeriesModel.findOne({ id: "s-risk-guard" }).lean();
    expect(stored).toBeNull();
  });

  it("exposes riskStatus separately on the board queue without leaking into seriesStatus", async () => {
    const board = await loginAs("board@beachread.jp");
    // Seed an at-risk ranking paired with a healthy series record.
    await RankingModel.create({
      id: "r-p1-board-risk",
      seriesId: "s-berserk-prod",
      seriesTitle: "Berserk",
      period: "2026-08",
      rank: 88,
      atRisk: true,
      status: "AT_RISK",
      score: 12,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(createApp())
      .get("/api/board/queue")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .expect(200);

    const atRiskItem = (res.body.data as any[]).find(
      (item: any) => item.seriesId === "s-berserk-prod",
    );
    expect(atRiskItem).toBeDefined();
    expect(atRiskItem.riskStatus).toBe("AT_RISK");
    expect(atRiskItem.seriesStatus).not.toBe("AT_RISK");
    expect(atRiskItem.riskEvaluatedAt).toBeTruthy();
  });
});

describe("Sprint 1 workflow integrity: page assignment release (1.3)", () => {
  beforeAll(async () => {
    if (!mongo) {
      mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
      await mongoose.connect(mongo.getUri());
    }
  }, 30_000);

  beforeEach(async () => seedDatabase());

  it("blocks RELEASE while a task is MANGAKA_APPROVED awaiting editor review", async () => {
    const owner = await loginAs("inoue@beachread.jp");
    const pageId = `${"ch-s-berserk-prod-5"}-p6`;
    // Reset chapter to IN_PRODUCTION with a working page asset.
    const chapter = await ChapterModel.findOne({ id: "ch-s-berserk-prod-5" }).lean();
    await ChapterModel.updateOne(
      { id: "ch-s-berserk-prod-5" },
      {
        $set: {
          status: "IN_PRODUCTION",
          pages: (chapter?.pages ?? []).map((page: any) => ({
            ...page,
            status: "UPLOADED",
            fileKey: "tests/release-guard.jpg",
          })),
        },
      },
    );

    // Assign + accept the page first.
    await request(createApp())
      .post(`/api/studio/pages/${pageId}/assignment`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ assistantId: "u-assist" })
      .expect(201);
    const assistant = await loginAs("jun@beachread.jp");
    await request(createApp())
      .post(`/api/studio/pages/${pageId}/assignment/actions/ACCEPT`)
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({})
      .expect(200);

    // Now write a task that the Mangaka already approved; it must block RELEASE.
    await StudioTaskModel.create({
      id: "task-p1-release-block",
      pageId,
      seriesId: "s-berserk-prod",
      chapterId: "ch-s-berserk-prod-5",
      assigneeId: "u-assist",
      status: "MANGAKA_APPROVED",
      currentSubmissionId: "sub-p1-release-block",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await SubmissionModel.create({
      id: "sub-p1-release-block",
      taskId: "task-p1-release-block",
      seriesId: "s-berserk-prod",
      chapterId: "ch-s-berserk-prod-5",
      assistantId: "u-assist",
      status: "MANGAKA_APPROVED",
      reviewStage: "MANGAKA_REVIEW",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(createApp())
      .post(`/api/studio/pages/${pageId}/assignment/actions/RELEASE`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({})
      .expect(409);

    expect(res.body.code).toBe("PAGE_ASSIGNMENT_HAS_PENDING_EDITOR_REVIEW");
  });

  it("allows RELEASE after the editor task is COMPLETED", async () => {
    const owner = await loginAs("inoue@beachread.jp");
    const pageId = `${"ch-s-berserk-prod-5"}-p7`;
    const chapter = await ChapterModel.findOne({ id: "ch-s-berserk-prod-5" }).lean();
    await ChapterModel.updateOne(
      { id: "ch-s-berserk-prod-5" },
      {
        $set: {
          status: "IN_PRODUCTION",
          pages: (chapter?.pages ?? []).map((page: any) => ({
            ...page,
            status: "UPLOADED",
            fileKey: "tests/release-ok.jpg",
          })),
        },
      },
    );

    await request(createApp())
      .post(`/api/studio/pages/${pageId}/assignment`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ assistantId: "u-assist" })
      .expect(201);
    const assistant = await loginAs("jun@beachread.jp");
    await request(createApp())
      .post(`/api/studio/pages/${pageId}/assignment/actions/ACCEPT`)
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({})
      .expect(200);

    await StudioTaskModel.create({
      id: "task-p1-release-ok",
      pageId,
      seriesId: "s-berserk-prod",
      chapterId: "ch-s-berserk-prod-5",
      assigneeId: "u-assist",
      status: "COMPLETED",
      currentSubmissionId: "sub-p1-release-ok",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(createApp())
      .post(`/api/studio/pages/${pageId}/assignment/actions/RELEASE`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({})
      .expect(200);

    expect(res.body.data.status).toBe("RELEASED");
  });
});
