import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import { vi } from "vitest";
import { createApp } from "../app.js";
import { repairDuplicateTaskEarnings } from "../scripts/repair-duplicate-task-earnings.js";
import {
  ChapterModel,
  ChapterReviewModel,
  EarningModel,
  MaterialModel,
  ProposalModel,
  RankingModel,
  SeriesModel,
  SeriesMemberModel,
  StudioCommentModel,
  StudioRegionModel,
  StudioTaskModel,
  SubmissionModel,
} from "../db/models.js";
import { seedDatabase } from "../seed.js";

let mongo: MongoMemoryReplSet;

async function loginAs(email: string, password = email) {
  const response = await request(createApp())
    .post("/api/auth/login")
    .send({ email, password })
    .expect(200);
  return response.body.data as {
    accessToken: string;
    refreshToken: string;
    user: { id: string; role: string };
  };
}

describe("MangaFlow MF-006 Workflow & Contract Gap Audit Tests", () => {
  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongo.getUri());
  });

  beforeEach(async () => {
    await seedDatabase();
    await ChapterModel.updateMany(
      { id: { $in: ["ch-s-berserk-prod-4", "ch-s-berserk-prod-5"] } },
      { $set: { status: "IN_PRODUCTION", "pages.$[].status": "UPLOADED" } },
    );
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  describe("GET /api/series auth-based scoping", () => {
    it("limits Mangakas to only view their own series", async () => {
      // Seed a second series with a different author
      await SeriesModel.create({
        id: "s-other-author",
        title: "Other Author Series",
        authorId: "u-other-mangaka",
        authorName: "Other Author",
        editorId: "u-editor",
        editorName: "Tanaka Akira",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const mangaka = await loginAs("inoue@beachread.jp");
      const res = await request(createApp())
        .get("/api/series")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .expect(200);

      expect(res.body.data).toBeInstanceOf(Array);
      // Inoue Takehiko's series should be returned, but not u-other-mangaka's
      const otherAuthorSeries = res.body.data.find((s: any) => s.id === "s-other-author");
      expect(otherAuthorSeries).toBeUndefined();
    });

    it("limits assistants to series they are assigned to as members", async () => {
      const assistant = await loginAs("jun@beachread.jp"); // id: u-assist

      const res = await request(createApp())
        .get("/api/series")
        .set("Authorization", `Bearer ${assistant.accessToken}`)
        .expect(200);

      expect(res.body.data).toBeInstanceOf(Array);
      // u-assist is seeded as member of s-berserk-prod and s-vinland-prod in data.ts
      const seriesIds = res.body.data.map((s: any) => s.id);
      expect(seriesIds).toContain("s-berserk-prod");
      expect(seriesIds).toContain("s-vinland-prod");
    });
  });

  describe("Pages CRUD & Presigned URLs", () => {
    it("handles page CRUD lifecycle on chapters", async () => {
      const mangaka = await loginAs("inoue@beachread.jp");
      const editor = await loginAs("tanaka@beachread.jp");

      await request(createApp())
        .post("/api/chapters/ch-s-berserk-prod-4/pages")
        .set("Authorization", `Bearer ${editor.accessToken}`)
        .send({ pageNumber: 998, imageUrl: "https://cdn.test/editor-page.png" })
        .expect(403);

      // 1. POST new page to chapter
      const createRes = await request(createApp())
        .post("/api/chapters/ch-s-berserk-prod-4/pages")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .send({
          id: "pg-test-999",
          pageNumber: 1,
          imageUrl: "https://mock-s3-bucket.r2.cloudflarestorage.com/test-page-999.png",
        })
        .expect(201);

      expect(createRes.body.data.id).toBe("pg-test-999");
      expect(createRes.body.data.status).toBe("UPLOADED");

      // Verify page was embedded
      const getRes = await request(createApp())
        .get("/api/chapters/ch-s-berserk-prod-4/pages")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .expect(200);
      expect(getRes.body.data.some((p: any) => p.id === "pg-test-999")).toBe(true);

      // 2. PATCH page metadata without directly mutating workflow status
      const patchRes = await request(createApp())
        .patch("/api/pages/pg-test-999")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .send({ fileName: "updated-page.png" })
        .expect(200);
      expect(patchRes.body.data.status).toBe("UPLOADED");
      expect(patchRes.body.data.fileName).toBe("updated-page.png");

      // 3. DELETE page
      await request(createApp())
        .delete("/api/pages/pg-test-999")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .expect(200);

      // Verify page is gone
      const verifyGetRes = await request(createApp())
        .get("/api/chapters/ch-s-berserk-prod-4/pages")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .expect(200);
      expect(verifyGetRes.body.data.some((p: any) => p.id === "pg-test-999")).toBe(false);
    });

    it("rejects the removed MARK_READY review bypass", async () => {
      const editor = await loginAs("tanaka@beachread.jp");
      await request(createApp())
        .post("/api/chapters/ch-s-berserk-prod-4/actions/MARK_READY")
        .set("Authorization", `Bearer ${editor.accessToken}`)
        .send({})
        .expect(400)
        .expect((response) => {
          expect(response.body.code).toBe("INVALID_ACTION");
        });
    });

    it("mocks presigned upload and download urls for a persisted file key", async () => {
      const mangaka = await loginAs("inoue@beachread.jp");

      const uploadRes = await request(createApp())
        .post("/api/files/presign-upload")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .send({ fileName: "sketch.png", fileType: "image/png" })
        .expect(200);

      expect(uploadRes.body.data.uploadUrl).toBeDefined();
      expect(uploadRes.body.data.key).toBeDefined();

      await ChapterModel.updateOne(
        { id: "ch-s-berserk-prod-4" },
        {
          $push: {
            pages: {
              id: "pg-presign-download-test",
              pageNumber: 999,
              fileKey: uploadRes.body.data.key,
              fileUrl: uploadRes.body.data.downloadUrl,
            },
          },
        },
      );

      const downloadRes = await request(createApp())
        .post("/api/files/presign-download")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .send({ key: uploadRes.body.data.key })
        .expect(200);

      expect(downloadRes.body.data.downloadUrl).toBeDefined();
    });

    it("allows Board to resolve proposal covers and rejects unrelated assistants", async () => {
      const board = await loginAs("board@beachread.jp");
      const assistant = await loginAs("jun@beachread.jp");
      await ProposalModel.create({
        id: "p-cover-access-test",
        slug: "cover-access-test",
        title: "Cover access",
        authorId: "u-mangaka",
        authorName: "Inoue",
        status: "PENDING_BOARD",
        coverFileKey: "covers/file-cover-access.png",
      });

      await request(createApp())
        .post("/api/files/presign-download")
        .set("Authorization", `Bearer ${board.accessToken}`)
        .send({ key: "covers/file-cover-access.png" })
        .expect(200);

      await request(createApp())
        .post("/api/files/presign-download")
        .set("Authorization", `Bearer ${assistant.accessToken}`)
        .send({ key: "covers/file-cover-access.png" })
        .expect(403);
    });

    it("issues presigned upload urls for PDF proposal files", async () => {
      const mangaka = await loginAs("inoue@beachread.jp");

      const uploadRes = await request(createApp())
        .post("/api/files/presign-upload")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .send({
          fileName: "sample-manuscript.pdf",
          contentType: "application/pdf",
          folder: "proposals/manuscripts",
        })
        .expect(200);

      expect(uploadRes.body.data.uploadUrl).toBeDefined();
      expect(uploadRes.body.data.key).toContain("proposals/manuscripts/");
    });
  });

  describe("Series Members sub-router CRUD", () => {
    it("retires direct team membership creation in favor of Assistant acceptance", async () => {
      const editor = await loginAs("tanaka@beachread.jp");

      const createRes = await request(createApp())
        .post("/api/series/s-berserk-prod/members")
        .set("Authorization", `Bearer ${editor.accessToken}`)
        .send({
          userId: "u-assist-new",
          role: "assistant",
          scope: "Lineart only",
          status: "active",
        })
        .expect(410);
      expect(createRes.body.code).toBe("INVITE_ACCEPTANCE_REQUIRED");
    });
  });

  describe("Task action states", () => {
    it("fully releases a region after Mangaka cancels a started task", async () => {
      const assistant = await loginAs("jun@beachread.jp");
      const mangaka = await loginAs("inoue@beachread.jp");

      await StudioRegionModel.create({
        id: "reg-cancel-unlock",
        chapterId: "ch-s-berserk-prod-4",
        status: "CONFIRMED",
        lockStatus: "UNLOCKED",
      });
      await StudioTaskModel.create({
        id: "tsk-cancel-unlock",
        title: "Cancel unlock task",
        chapterId: "ch-s-berserk-prod-4",
        regionId: "reg-cancel-unlock",
        status: "TODO",
        assigneeId: assistant.user.id,
        assigneeName: "Jun",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await request(createApp())
        .post("/api/studio/tasks/tsk-cancel-unlock/actions/start")
        .set("Authorization", `Bearer ${assistant.accessToken}`)
        .expect(200);

      const locked = await StudioRegionModel.findOne({ id: "reg-cancel-unlock" }).lean();
      expect((locked as any)?.lockedByTaskId).toBe("tsk-cancel-unlock");

      await request(createApp())
        .post("/api/studio/tasks/tsk-cancel-unlock/actions/cancel")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .send({ reason: "Reassign production scope" })
        .expect(200);

      const released = await StudioRegionModel.findOne({ id: "reg-cancel-unlock" }).lean();
      expect((released as any)?.activeTaskId ?? null).toBeNull();
      expect((released as any)?.lockedByTaskId ?? null).toBeNull();
      expect((released as any)?.lockStatus).toBe("UNLOCKED");
    });

    it("limits assistant task list and direct task reads to assigned tasks", async () => {
      const assistant = await loginAs("jun@beachread.jp");

      await StudioTaskModel.create([
        {
          id: "tsk-assigned-only",
          title: "Assigned Task",
          chapterId: "ch-s-berserk-prod-4",
          status: "TODO",
          assigneeId: assistant.user.id,
          assigneeName: "Jun",
        },
        {
          id: "tsk-other-assistant",
          title: "Other Assistant Task",
          chapterId: "ch-s-berserk-prod-4",
          status: "TODO",
          assigneeId: "u-other-assistant",
          assigneeName: "Other Assistant",
        },
      ]);

      const listRes = await request(createApp())
        .get("/api/studio/tasks?assigneeId=u-other-assistant")
        .set("Authorization", `Bearer ${assistant.accessToken}`)
        .expect(200);

      const taskIds = listRes.body.data.map((task: any) => task.id);
      expect(taskIds).toContain("tsk-assigned-only");
      expect(taskIds).not.toContain("tsk-other-assistant");

      await request(createApp())
        .get("/api/studio/tasks/tsk-other-assistant")
        .set("Authorization", `Bearer ${assistant.accessToken}`)
        .expect(403);
    });

    it("blocks assistants from acting on or submitting to unassigned tasks", async () => {
      const assistant = await loginAs("jun@beachread.jp");

      await StudioTaskModel.create({
        id: "tsk-unassigned-guard",
        title: "Unassigned Guard Task",
        chapterId: "ch-s-berserk-prod-4",
        status: "TODO",
        assigneeId: "u-other-assistant",
        assigneeName: "Other Assistant",
      });

      await request(createApp())
        .post("/api/studio/tasks/tsk-unassigned-guard/actions/start")
        .set("Authorization", `Bearer ${assistant.accessToken}`)
        .expect(403);

      await request(createApp())
        .post("/api/submissions")
        .set("Authorization", `Bearer ${assistant.accessToken}`)
        .send({ taskId: "tsk-unassigned-guard", intent: "SUBMIT", fileKey: "uploads/proof.png" })
        .expect(410);

      await request(createApp())
        .post("/api/tasks/tsk-unassigned-guard/submit")
        .set("Authorization", `Bearer ${assistant.accessToken}`)
        .set("Idempotency-Key", "idem-unassigned-guard")
        .send({ expectedCurrentSubmissionId: null, fileKey: "uploads/proof.png" })
        .expect(403);
    });

    it("creates assistant submissions with server-owned identity and submitted status", async () => {
      const assistant = await loginAs("jun@beachread.jp");

      await StudioTaskModel.create({
        id: "tsk-submit-owned",
        title: "Owned Submit Task",
        chapterId: "ch-s-berserk-prod-4",
        status: "IN_PROGRESS",
        assigneeId: assistant.user.id,
        assigneeName: "Jun",
      });

      const res = await request(createApp())
        .post("/api/tasks/tsk-submit-owned/submit")
        .set("Authorization", `Bearer ${assistant.accessToken}`)
        .set("Idempotency-Key", "idem-submit-owned")
        .send({ expectedCurrentSubmissionId: null, fileKey: "uploads/proof.png" })
        .expect(201);

      expect(res.body.data.assistantId).toBe(assistant.user.id);
      expect(res.body.data.status).toBe("PENDING");
      expect(res.body.data.version).toBe(1);
      expect(res.body.data.submittedAt).toBeDefined();

      const task = await StudioTaskModel.findOne({ id: "tsk-submit-owned" }).lean();
      expect((task as any).status).toBe("SUBMITTED");
      expect((task as any).currentSubmissionId).toBe(res.body.data.id);
    });

    it("applies task status transitions through actions", async () => {
      const assistant = await loginAs("jun@beachread.jp");

      // Create a test task in TODO state
      await StudioTaskModel.create({
        id: "tsk-transition-test",
        title: "Transition Test Task",
        chapterId: "ch-s-berserk-prod-4",
        status: "TODO",
        assigneeId: assistant.user.id,
        assigneeName: "Jun",
      });

      // 1. START action -> IN_PROGRESS
      const startRes = await request(createApp())
        .post("/api/studio/tasks/tsk-transition-test/actions/start")
        .set("Authorization", `Bearer ${assistant.accessToken}`)
        .expect(200);
      expect(startRes.body.data.status).toBe("IN_PROGRESS");

      // 2. Legacy SUBMIT action is removed; canonical submit path creates the submission.
      await request(createApp())
        .post("/api/studio/tasks/tsk-transition-test/actions/submit")
        .set("Authorization", `Bearer ${assistant.accessToken}`)
        .expect(410);

      const submitRes = await request(createApp())
        .post("/api/tasks/tsk-transition-test/submit")
        .set("Authorization", `Bearer ${assistant.accessToken}`)
        .set("Idempotency-Key", "idem-transition-submit")
        .send({ expectedCurrentSubmissionId: null, fileKey: "uploads/proof.png" })
        .expect(201);
      expect(submitRes.body.data.status).toBe("PENDING");

      // 3. Task block actions are removed from the canonical workflow.
      const blockRes = await request(createApp())
        .post("/api/studio/tasks/tsk-transition-test/actions/block")
        .set("Authorization", `Bearer ${assistant.accessToken}`)
        .send({ reason: "Missing base layout storyboard" })
        .expect(400);
      expect(blockRes.body.code).toBe("INVALID_ACTION");

      // 4. The legacy unblock endpoint is removed as well.
      const unblockRes = await request(createApp())
        .post("/api/studio/tasks/tsk-transition-test/actions/unblock")
        .set("Authorization", `Bearer ${assistant.accessToken}`)
        .expect(400);
      expect(unblockRes.body.code).toBe("INVALID_ACTION");
    });

    it("starts a TODO task without a separate blocked state", async () => {
      const assistant = await loginAs("jun@beachread.jp");
      await StudioTaskModel.create({
        id: "tsk-start-blocked",
        title: "Start Without Block State",
        chapterId: "ch-s-berserk-prod-4",
        status: "TODO",
        assigneeId: assistant.user.id,
        assigneeName: "Jun",
      });

      const response = await request(createApp())
        .post("/api/studio/tasks/tsk-start-blocked/actions/start")
        .set("Authorization", `Bearer ${assistant.accessToken}`)
        .expect(200);

      expect(response.body.data.status).toBe("IN_PROGRESS");
      const task = await StudioTaskModel.findOne({ id: "tsk-start-blocked" }).lean();
      expect((task as any)?.status).toBe("IN_PROGRESS");
      expect((task as any)?.startedAt).toBeDefined();
    });

    it("rejects START after Mangaka approval without relocking the region", async () => {
      const assistant = await loginAs("jun@beachread.jp");
      await StudioRegionModel.create({
        id: "reg-start-approved",
        chapterId: "ch-s-berserk-prod-4",
        status: "APPROVED",
      });
      await StudioTaskModel.create({
        id: "tsk-start-approved",
        title: "Approved Task",
        chapterId: "ch-s-berserk-prod-4",
        regionId: "reg-start-approved",
        status: "MANGAKA_APPROVED",
        assigneeId: assistant.user.id,
        assigneeName: "Jun",
      });

      const response = await request(createApp())
        .post("/api/studio/tasks/tsk-start-approved/actions/start")
        .set("Authorization", `Bearer ${assistant.accessToken}`)
        .expect(409);

      expect(response.body.code).toBe("INVALID_TRANSITION");
      const region = await StudioRegionModel.findOne({ id: "reg-start-approved" }).lean();
      expect((region as any).status).toBe("APPROVED");
      expect((region as any).lockStatus).toBe("UNLOCKED");
    });
  });

  describe("Creator self-approval check", () => {
    it("blocks assistants from approving their own submission and allows mangakas", async () => {
      const assistant = await loginAs("jun@beachread.jp"); // id: u-assist
      const mangaka = await loginAs("inoue@beachread.jp"); // id: u-mangaka

      // Create a test task and submission
      await StudioTaskModel.create({
        id: "tsk-self-approve",
        title: "Self Approve Task",
        chapterId: "ch-s-berserk-prod-4",
        status: "SUBMITTED",
        assigneeId: assistant.user.id,
        currentSubmissionId: "sub-self-approve",
      });

      const submission = await SubmissionModel.create({
        id: "sub-self-approve",
        taskId: "tsk-self-approve",
        chapterId: "ch-s-berserk-prod-4",
        assistantId: assistant.user.id,
        assistantName: "Jun",
        imageUrl: "https://mock-s3-bucket/sketch.png",
        status: "PENDING",
        submittedAt: new Date().toISOString(),
      });

      // 1. Assistant tries to approve their own submission -> 403 Forbidden (RBAC blocks ASSISTANT from review actions)
      const errRes = await request(createApp())
        .post(`/api/submissions/${submission.id}/approve`)
        .set("Authorization", `Bearer ${assistant.accessToken}`)
        .expect(403);
      expect(errRes.body.code).toBe("FORBIDDEN");

      // 2. Mangaka approves the submission -> 200 OK
      const approveRes = await request(createApp())
        .post(`/api/submissions/${submission.id}/approve`)
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .expect(200);
      expect(approveRes.body.data.status).toBe("MANGAKA_APPROVED");

      // Verify that the task status synced correctly to MANGAKA_APPROVED
      const task = await StudioTaskModel.findOne({ id: "tsk-self-approve" }).lean();
      expect((task as any).status).toBe("MANGAKA_APPROVED");
    });

    it("keeps one earning when a replacement submission is approved", async () => {
      const assistant = await loginAs("jun@beachread.jp");
      const mangaka = await loginAs("inoue@beachread.jp");
      await StudioTaskModel.create({
        id: "tsk-canonical-earning",
        title: "Canonical Earning Task",
        chapterId: "ch-s-berserk-prod-4",
        status: "SUBMITTED",
        assigneeId: assistant.user.id,
        assigneeName: "Jun",
        currentSubmissionId: "sub-canonical-earning",
      });
      await SubmissionModel.create({
        id: "sub-canonical-earning",
        taskId: "tsk-canonical-earning",
        chapterId: "ch-s-berserk-prod-4",
        assistantId: assistant.user.id,
        assistantName: "Jun",
        status: "PENDING",
        submittedAt: new Date(),
      });
      await EarningModel.create({
        id: "earn-canonical-existing",
        assistantId: assistant.user.id,
        period: "2026-07",
        taskId: "tsk-canonical-earning",
        sourceKey: "TASK_APPROVAL:tsk-canonical-earning:sub-old",
        amount: 0,
        status: "EARNED",
      });

      await request(createApp())
        .post("/api/submissions/sub-canonical-earning/approve")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .expect(200);

      expect(await EarningModel.countDocuments({ taskId: "tsk-canonical-earning" })).toBe(1);
    });

    it("dry-runs then repairs duplicate task earnings", async () => {
      await EarningModel.createIndexes();
      await EarningModel.collection.dropIndex("taskId_1");
      try {
        await EarningModel.collection.insertMany([
          {
            id: "earn-repair-first",
            assistantId: "u-assist",
            period: "2026-07",
            taskId: "tsk-repair-duplicates",
            amount: 100,
            status: "EARNED",
            createdAt: new Date("2026-07-01T00:00:00.000Z"),
          },
          {
            id: "earn-repair-later-a",
            assistantId: "u-assist",
            period: "2026-07",
            taskId: "tsk-repair-duplicates",
            amount: 100,
            status: "EARNED",
            createdAt: new Date("2026-07-02T00:00:00.000Z"),
          },
          {
            id: "earn-repair-later-b",
            assistantId: "u-assist",
            period: "2026-07",
            taskId: "tsk-repair-duplicates",
            amount: 100,
            status: "EARNED",
            createdAt: new Date("2026-07-03T00:00:00.000Z"),
          },
        ]);

        expect(await repairDuplicateTaskEarnings(false)).toEqual({ retained: 1, reversed: 2 });
        expect(await EarningModel.countDocuments({ taskId: "tsk-repair-duplicates" })).toBe(3);

        expect(await repairDuplicateTaskEarnings(true)).toEqual({ retained: 1, reversed: 2 });
        const retained = await EarningModel.findOne({ id: "earn-repair-first" }).lean();
        const reversed = await EarningModel.find({
          id: { $in: ["earn-repair-later-a", "earn-repair-later-b"] },
        })
          .sort({ id: 1 })
          .lean();
        expect((retained as any).taskId).toBe("tsk-repair-duplicates");
        expect(reversed).toHaveLength(2);
        for (const earning of reversed as any[]) {
          expect(earning.status).toBe("REVERSED");
          expect(earning).not.toHaveProperty("taskId");
          expect(earning.metadata).toMatchObject({
            originalTaskId: "tsk-repair-duplicates",
            reversalOf: "earn-repair-first",
          });
        }
      } finally {
        await EarningModel.collection.createIndex({ taskId: 1 }, { unique: true, sparse: true });
      }
    });
  });

  describe("Mangaka sends a production chapter to Editor Review", () => {
    async function createReviewFixture(options?: {
      ownerId?: string;
      editorId?: string | null;
      chapterAssigneeId?: string;
      page?: boolean;
      chapterStatus?: string;
      taskStatus?: string;
      submissionStatus?: string;
      blockingTarget?: "CHAPTER" | "PAGE" | "REGION" | "TASK" | "SUBMISSION";
    }) {
      const suffix = Math.random().toString(36).slice(2, 9);
      const proposalId = `p-review-${suffix}`;
      const seriesId = `s-review-${suffix}`;
      const chapterId = `ch-review-${suffix}`;
      const pageId = `pg-review-${suffix}`;
      const taskId = `tsk-review-${suffix}`;
      const submissionId = `sub-review-${suffix}`;
      const ownerId = options?.ownerId ?? "u-mangaka";
      const editorId = options && Object.prototype.hasOwnProperty.call(options, "editorId")
        ? options.editorId
        : "u-editor";

      await ProposalModel.create({
        id: proposalId,
        slug: proposalId,
        title: "Approved review fixture",
        authorId: ownerId,
        authorName: "Mangaka",
        status: "APPROVED",
      });
      await SeriesModel.create({
        id: seriesId,
        slug: seriesId,
        title: "Production review fixture",
        authorId: ownerId,
        authorName: "Mangaka",
        ...(editorId ? { editorId, editorName: "Editor" } : {}),
        publicationType: "WEEKLY",
        proposalId,
        sourceProposalId: proposalId,
        status: "ONGOING",
      });
      await ChapterModel.create({
        id: chapterId,
        seriesId,
        number: 91,
        title: "Review chapter",
        status: options?.chapterStatus ?? "IN_PRODUCTION",
        assigneeId: options?.chapterAssigneeId ?? ownerId,
        assigneeName: "Mangaka",
        pages:
          options?.page === false
            ? []
            : [
                {
                  id: pageId,
                  pageNumber: 1,
                  status: "UPLOADED",
                  fileKey: `chapters/${chapterId}/page.png`,
                  fileUrl: "metadata://local/page.png",
                },
              ],
        history: [],
      });

      if (options?.taskStatus) {
        await StudioTaskModel.create({
          id: taskId,
          seriesId,
          chapterId,
          pageId,
          title: "Assistant task",
          assigneeId: "u-assist",
          assigneeName: "Assistant",
          status: options.taskStatus,
          currentSubmissionId: options?.submissionStatus ? submissionId : undefined,
        });
      }
      if (options?.submissionStatus) {
        await SubmissionModel.create({
          id: submissionId,
          taskId,
          seriesId,
          chapterId,
          pageId,
          assistantId: "u-assist",
          status: options.submissionStatus,
          reviewStage: "MANGAKA_REVIEW",
          version: 71,
        });
      }
      if (options?.blockingTarget) {
        const targetIds = {
          CHAPTER: chapterId,
          PAGE: pageId,
          REGION: `region-${suffix}`,
          TASK: taskId,
          SUBMISSION: submissionId,
        };
        await StudioCommentModel.create({
          id: `comment-${suffix}`,
          seriesId,
          targetType: options.blockingTarget,
          targetId: targetIds[options.blockingTarget],
          authorId: "u-editor",
          authorName: "Editor",
          authorRole: "EDITOR",
          body: "Blocking review note",
          isBlocking: true,
          status: "OPEN",
        });
      }
      return { proposalId, seriesId, chapterId, pageId, taskId, submissionId };
    }

    it("sends an uploaded chapter without assistant tasks directly to Editor Review", async () => {
      const mangaka = await loginAs("inoue@beachread.jp");
      const fixture = await createReviewFixture({ ownerId: mangaka.user.id });

      const response = await request(createApp())
        .post(`/api/studio/chapters/${fixture.chapterId}/send-editor-review`)
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .expect(200);

      expect(response.body.data.nextStatus).toBe("TANTOU_REVIEW");
      expect(response.body.data.flow).toBe("DIRECT");
      expect(response.body.data.chapter.status).toBe("TANTOU_REVIEW");
      expect(response.body.data.pages[0].status).toBe("UPLOADED");
    });

    it("requires an active Tantou before opening Editor Review", async () => {
      const mangaka = await loginAs("inoue@beachread.jp");
      const fixture = await createReviewFixture({ ownerId: mangaka.user.id, editorId: null });

      const response = await request(createApp())
        .post(`/api/studio/chapters/${fixture.chapterId}/send-editor-review`)
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .expect(409);

      expect(response.body.code).toBe("TANTOU_ASSIGNMENT_REQUIRED");
      expect(await ChapterModel.findOne({ id: fixture.chapterId }).then((chapter) => chapter?.status)).toBe(
        "IN_PRODUCTION",
      );
    });

    it("keeps an unresolved blocking comment after Tantou reassignment", async () => {
      const mangaka = await loginAs("inoue@beachread.jp");
      const fixture = await createReviewFixture({
        ownerId: mangaka.user.id,
        editorId: "u-mobile-editor",
        blockingTarget: "CHAPTER",
      });

      const response = await request(createApp())
        .post(`/api/studio/chapters/${fixture.chapterId}/send-editor-review`)
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .expect(409);

      expect(response.body.code).toBe("BLOCKING_COMMENTS_UNRESOLVED");
    });

    it("resubmits after the Mangaka addresses the Editor's blocking revision comment", async () => {
      const mangaka = await loginAs("inoue@beachread.jp");
      const editor = await loginAs("tanaka@beachread.jp");
      const fixture = await createReviewFixture({ ownerId: mangaka.user.id });

      const initialReview = await request(createApp())
        .post(`/api/studio/chapters/${fixture.chapterId}/send-editor-review`)
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .expect(200);
      const firstSnapshot = initialReview.body.data.chapter.reviewSnapshot;

      await request(createApp())
        .post(`/api/chapters/${fixture.chapterId}/actions/REQUEST_REVISION`)
        .set("Authorization", `Bearer ${editor.accessToken}`)
        .send({
          targetType: "PAGE",
          targetId: fixture.pageId,
          feedback: "Please revise this page.",
        })
        .expect(200);
      await ChapterModel.updateOne(
        { id: fixture.chapterId },
        { $set: { "pages.0.status": "UPLOADED" } },
      );

      const blockedResubmit = await request(createApp())
        .post(`/api/chapters/${fixture.chapterId}/actions/RESUBMIT`)
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .expect(409);
      expect(blockedResubmit.body.code).toBe("BLOCKING_COMMENTS_UNRESOLVED");
      const blockedChapter = await ChapterModel.findOne({ id: fixture.chapterId }).lean();
      expect((blockedChapter as any).revisionRound).toBe(0);

      const blockingComment = await StudioCommentModel.findOne({
        chapterId: fixture.chapterId,
        targetId: fixture.pageId,
        isBlocking: true,
      }).lean();
      expect(blockingComment).toBeTruthy();
      await request(createApp())
        .post(`/api/comments/${(blockingComment as any).id}/address`)
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .send({})
        .expect(200);

      const resubmitted = await request(createApp())
        .post(`/api/chapters/${fixture.chapterId}/actions/RESUBMIT`)
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .expect(200);

      expect(resubmitted.body.data.status).toBe("TANTOU_REVIEW");
      expect(resubmitted.body.data.revisionRound).toBe(1);
      expect(resubmitted.body.data.reviewSnapshot).not.toEqual(firstSnapshot);

      await request(createApp())
        .post(`/api/chapters/${fixture.chapterId}/actions/EDITOR_APPROVE`)
        .set("Authorization", `Bearer ${editor.accessToken}`)
        .send({})
        .expect(409)
        .expect((response) => {
          expect(response.body.code).toBe("BLOCKING_COMMENTS_UNVERIFIED");
        });

      await request(createApp())
        .post(`/api/comments/${(blockingComment as any).id}/resolve`)
        .set("Authorization", `Bearer ${editor.accessToken}`)
        .send({})
        .expect(200);

      await request(createApp())
        .post(`/api/chapters/${fixture.chapterId}/actions/EDITOR_APPROVE`)
        .set("Authorization", `Bearer ${editor.accessToken}`)
        .send({})
        .expect(200);
    });

    it("rolls back a RESUBMIT when review persistence fails", async () => {
      const mangaka = await loginAs("inoue@beachread.jp");
      const editor = await loginAs("tanaka@beachread.jp");
      const fixture = await createReviewFixture({ ownerId: mangaka.user.id });
      await request(createApp())
        .post(`/api/studio/chapters/${fixture.chapterId}/send-editor-review`)
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .expect(200);
      await request(createApp())
        .post(`/api/chapters/${fixture.chapterId}/actions/REQUEST_REVISION`)
        .set("Authorization", `Bearer ${editor.accessToken}`)
        .send({ targetType: "PAGE", targetId: fixture.pageId, feedback: "Revise." })
        .expect(200);
      await ChapterModel.updateOne(
        { id: fixture.chapterId },
        { $set: { "pages.0.status": "UPLOADED" } },
      );
      const comment = await StudioCommentModel.findOne({ chapterId: fixture.chapterId }).lean();
      await request(createApp())
        .post(`/api/comments/${(comment as any).id}/address`)
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .send({})
        .expect(200);

      const reviewWrite = vi
        .spyOn(ChapterReviewModel, "findOneAndUpdate")
        .mockRejectedValueOnce(new Error("simulated review write failure"));
      await request(createApp())
        .post(`/api/chapters/${fixture.chapterId}/actions/RESUBMIT`)
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .expect(500);
      reviewWrite.mockRestore();

      const chapter = await ChapterModel.findOne({ id: fixture.chapterId }).lean();
      expect((chapter as any).status).toBe("REVISION_REQUIRED");
      expect((chapter as any).revisionRound ?? 0).toBe(0);
      expect((chapter as any).pages[0].status).toBe("UPLOADED");
    });

    it.each(["TODO", "IN_PROGRESS", "SUBMITTED"])(
      "blocks editor review while an assistant task is %s",
      async (taskStatus) => {
        const mangaka = await loginAs("inoue@beachread.jp");
        const fixture = await createReviewFixture({
          ownerId: mangaka.user.id,
          taskStatus,
          submissionStatus: taskStatus === "SUBMITTED" ? "PENDING" : undefined,
        });

        const response = await request(createApp())
          .post(`/api/studio/chapters/${fixture.chapterId}/send-editor-review`)
          .set("Authorization", `Bearer ${mangaka.accessToken}`)
          .expect(409);
        expect(response.body.code).toBe("TASKS_NOT_MANGAKA_APPROVED");
      },
    );

    it("sends the assistant flow after task and submission are Mangaka-approved", async () => {
      const mangaka = await loginAs("inoue@beachread.jp");
      const fixture = await createReviewFixture({
        ownerId: mangaka.user.id,
        taskStatus: "MANGAKA_APPROVED",
        submissionStatus: "MANGAKA_APPROVED",
      });

      const response = await request(createApp())
        .post(`/api/studio/chapters/${fixture.chapterId}/send-editor-review`)
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .expect(200);
      expect(response.body.data.flow).toBe("ASSISTANT_TASK");

      const task = await StudioTaskModel.findOne({ id: fixture.taskId }).lean();
      const submission = await SubmissionModel.findOne({ id: fixture.submissionId }).lean();
      expect((task as any).status).toBe("MANGAKA_APPROVED");
      expect((submission as any).status).toBe("MANGAKA_APPROVED");
    });

    it("blocks unresolved blocking comments", async () => {
      const mangaka = await loginAs("inoue@beachread.jp");
      const fixture = await createReviewFixture({
        ownerId: mangaka.user.id,
        blockingTarget: "PAGE",
      });

      const response = await request(createApp())
        .post(`/api/studio/chapters/${fixture.chapterId}/send-editor-review`)
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .expect(409);
      expect(response.body.code).toBe("BLOCKING_COMMENTS_UNRESOLVED");
    });

    it("keeps blocking comments valid across Tantou assignment changes", async () => {
      const mangaka = await loginAs("inoue@beachread.jp");
      const fixture = await createReviewFixture({ ownerId: mangaka.user.id });
      await StudioCommentModel.create({
        id: `comment-unassigned-${fixture.chapterId}`,
        seriesId: fixture.seriesId,
        chapterId: fixture.chapterId,
        targetType: "CHAPTER",
        targetId: fixture.chapterId,
        authorId: "u-mobile-editor",
        authorName: "Unassigned Editor",
        authorRole: "EDITOR",
        body: "Unassigned blocking note",
        isBlocking: true,
        status: "OPEN",
      });

      await request(createApp())
        .post(`/api/studio/chapters/${fixture.chapterId}/send-editor-review`)
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .expect(409)
        .expect((response) => {
          expect(response.body.code).toBe("BLOCKING_COMMENTS_UNRESOLVED");
        });
    });

    it("submits a Chapter without applying a Supporting Material status gate", async () => {
      const mangaka = await loginAs("inoue@beachread.jp");
      const fixture = await createReviewFixture({ ownerId: mangaka.user.id });
      await MaterialModel.create({
        id: `mat-${fixture.chapterId}`,
        seriesId: fixture.seriesId,
        chapterId: fixture.chapterId,
        title: "Draft review material",
        status: "DRAFT",
        fileKey: `materials/${fixture.chapterId}.png`,
      });

      const response = await request(createApp())
        .post(`/api/studio/chapters/${fixture.chapterId}/send-editor-review`)
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .expect(200);
      expect(response.body.data.chapter.status).toBe("TANTOU_REVIEW");
    });

    it("rejects a Mangaka who does not own the series", async () => {
      const mangaka = await loginAs("inoue@beachread.jp");
      const fixture = await createReviewFixture({ ownerId: "u-someone-else" });
      const response = await request(createApp())
        .post(`/api/studio/chapters/${fixture.chapterId}/send-editor-review`)
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .expect(403);
      expect(response.body.code).toBe("MANGAKA_OWNER_REQUIRED");
    });

    it("does not let an assigned non-owner Mangaka submit a chapter for review", async () => {
      const mangaka = await loginAs("inoue@beachread.jp");
      const fixture = await createReviewFixture({
        ownerId: "u-someone-else",
        chapterAssigneeId: mangaka.user.id,
      });

      const response = await request(createApp())
        .post(`/api/chapters/${fixture.chapterId}/actions/SUBMIT_REVIEW`)
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .send({})
        .expect(403);

      expect(response.body.code).toBe("MANGAKA_OWNER_REQUIRED");
    });

    it("rejects non-Mangaka roles", async () => {
      const editor = await loginAs("tanaka@beachread.jp");
      const fixture = await createReviewFixture();
      await request(createApp())
        .post(`/api/studio/chapters/${fixture.chapterId}/send-editor-review`)
        .set("Authorization", `Bearer ${editor.accessToken}`)
        .expect(403);
    });

    it("blocks a chapter without an uploaded page image", async () => {
      const mangaka = await loginAs("inoue@beachread.jp");
      const fixture = await createReviewFixture({ ownerId: mangaka.user.id, page: false });
      const response = await request(createApp())
        .post(`/api/studio/chapters/${fixture.chapterId}/send-editor-review`)
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .expect(409);
      expect(response.body.code).toBe("PAGE_IMAGE_REQUIRED");
    });

    it("does not expose canonical assistant submissions in the legacy Editor review queue", async () => {
      const mangaka = await loginAs("inoue@beachread.jp");
      const editor = await loginAs("tanaka@beachread.jp");
      const sent = await createReviewFixture({
        ownerId: mangaka.user.id,
        taskStatus: "MANGAKA_APPROVED",
        submissionStatus: "MANGAKA_APPROVED",
      });
      const unsent = await createReviewFixture({
        ownerId: mangaka.user.id,
        taskStatus: "MANGAKA_APPROVED",
        submissionStatus: "MANGAKA_APPROVED",
      });
      await request(createApp())
        .post(`/api/studio/chapters/${sent.chapterId}/send-editor-review`)
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .expect(200);

      const queue = await request(createApp())
        .get("/api/submissions/review-queue")
        .set("Authorization", `Bearer ${editor.accessToken}`)
        .expect(200);
      const ids = queue.body.data.map((submission: any) => submission.id);
      expect(ids).not.toContain(sent.submissionId);
      expect(ids).not.toContain(unsent.submissionId);
    });

    it("propagates Editor approval and revision to page, task, and submission states", async () => {
      const mangaka = await loginAs("inoue@beachread.jp");
      const editor = await loginAs("tanaka@beachread.jp");
      const approved = await createReviewFixture({
        ownerId: mangaka.user.id,
        taskStatus: "MANGAKA_APPROVED",
        submissionStatus: "MANGAKA_APPROVED",
      });
      await request(createApp())
        .post(`/api/studio/chapters/${approved.chapterId}/send-editor-review`)
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .expect(200);
      await request(createApp())
        .post(`/api/chapters/${approved.chapterId}/actions/EDITOR_APPROVE`)
        .set("Authorization", `Bearer ${editor.accessToken}`)
        .expect(200);

      const approvedChapter = await ChapterModel.findOne({ id: approved.chapterId }).lean();
      const approvedTask = await StudioTaskModel.findOne({ id: approved.taskId }).lean();
      const approvedSubmission = await SubmissionModel.findOne({
        id: approved.submissionId,
      }).lean();
      expect((approvedChapter as any).status).toBe("READY_FOR_PUBLICATION");
      expect((approvedChapter as any).pages[0].status).toBe("FINALIZED");
      expect((approvedTask as any).status).toBe("MANGAKA_APPROVED");
      expect((approvedSubmission as any).status).toBe("MANGAKA_APPROVED");

      const revised = await createReviewFixture({
        ownerId: mangaka.user.id,
        taskStatus: "MANGAKA_APPROVED",
        submissionStatus: "MANGAKA_APPROVED",
      });
      await request(createApp())
        .post(`/api/studio/chapters/${revised.chapterId}/send-editor-review`)
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .expect(200);
      await request(createApp())
        .post(`/api/chapters/${revised.chapterId}/actions/REQUEST_REVISION`)
        .set("Authorization", `Bearer ${editor.accessToken}`)
        .send({
          targetType: "TASK",
          targetId: revised.taskId,
          feedback: "Please revise the lettering.",
        })
        .expect(200);

      const revisedChapter = await ChapterModel.findOne({ id: revised.chapterId }).lean();
      const revisedTask = await StudioTaskModel.findOne({ id: revised.taskId }).lean();
      const revisedSubmission = await SubmissionModel.findOne({ id: revised.submissionId }).lean();
      expect((revisedChapter as any).status).toBe("REVISION_REQUIRED");
      expect((revisedChapter as any).pages[0].status).toBe("UPLOADED");
      expect((revisedTask as any).status).toBe("MANGAKA_APPROVED");
      expect((revisedSubmission as any).status).toBe("MANGAKA_APPROVED");
    });

    it("writes only canonical statuses, never action or deprecated status names", async () => {
      const mangaka = await loginAs("inoue@beachread.jp");
      const fixture = await createReviewFixture({ ownerId: mangaka.user.id });
      await request(createApp())
        .post(`/api/studio/chapters/${fixture.chapterId}/send-editor-review`)
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .expect(200);

      const chapter = await ChapterModel.findOne({ id: fixture.chapterId }).lean();
      const written = [
        (chapter as any).status,
        ...(chapter as any).pages.map((page: any) => page.status),
      ];
      expect(written).not.toContain("SUBMIT_REVIEW");
      expect(written).not.toContain("OPEN");
      expect(written).not.toContain("COMPLETED");
      expect(written).not.toContain("REVISION_REQUESTED");
    });

    it("rejects the retired Chapter ARCHIVE action without changing the chapter", async () => {
      const mangaka = await loginAs("inoue@beachread.jp");
      const fixture = await createReviewFixture({ ownerId: mangaka.user.id });
      const editor = await loginAs("tanaka@beachread.jp");

      const response = await request(createApp())
        .post(`/api/chapters/${fixture.chapterId}/actions/ARCHIVE`)
        .set("Authorization", `Bearer ${editor.accessToken}`)
        .send({ reason: "Production record closed" })
        .expect(400);

      expect(response.body.code).toBe("INVALID_ACTION");
      const unchanged = await ChapterModel.findOne({ id: fixture.chapterId }).lean();
      expect((unchanged as any).status).toBe("IN_PRODUCTION");
      expect((unchanged as any).archivedAt).toBeUndefined();
    });
  });

  describe("Rankings scoping & read-only Mangaka restrictions", () => {
    it("restricts Mangakas to view only rankings associated with their own series", async () => {
      const mangaka = await loginAs("inoue@beachread.jp");

      // Let's check which series are in database: s-berserk-prod, s-vinland-prod.
      // Inoue Takehiko is the author of both or proposal p-001/etc. Let's make sure.
      // Let's inspect the rankings
      const res = await request(createApp())
        .get("/api/rankings")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .expect(200);

      expect(res.body.data).toBeInstanceOf(Array);
      // Mangaka should only see rankings of series they author.
      // Let's check s-vinland-prod where they might not be author, or let's create a ranking for a series of another author.
      await SeriesModel.create({
        id: "s-other-author-series",
        title: "Other Author Series",
        authorId: "u-other-mangaka",
        authorName: "Other Author",
        editorId: "u-editor",
        editorName: "Tanaka Akira",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await RankingModel.create({
        id: "rank-other",
        seriesId: "s-other-author-series",
        seriesTitle: "Other Author Series",
        period: "2026-W26",
        finalScore: 9.9,
        atRisk: false,
      });

      const freshRes = await request(createApp())
        .get("/api/rankings")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .expect(200);

      // The other author's ranking should not be present
      expect(freshRes.body.data.some((r: any) => r.id === "rank-other")).toBe(false);

      // Let's try to query the other author's ranking directly using /api/series/:seriesId/rankings
      const directErrRes = await request(createApp())
        .get("/api/series/s-other-author-series/rankings")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .expect(403);
      expect(directErrRes.body.code).toBe("FORBIDDEN");
    });
  });
});
