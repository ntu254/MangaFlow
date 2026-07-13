import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import bcrypt from "bcryptjs";
import { createApp } from "../app.js";
import {
  ChapterModel,
  MaterialModel,
  ProposalModel,
  RankingModel,
  SeriesModel,
  SeriesMemberModel,
  StudioCommentModel,
  StudioTaskModel,
  SubmissionModel,
  UserModel,
} from "../db/models.js";
import { seedDatabase } from "../seed.js";

let mongo: MongoMemoryServer;

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

async function createAndLoginOtherMangaka() {
  await UserModel.create({
    id: "u-other-mangaka",
    name: "Other Mangaka",
    email: "other-mangaka@beachread.jp",
    passwordHash: await bcrypt.hash("other-mangaka@beachread.jp", 10),
    role: "MANGAKA",
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return loginAs("other-mangaka@beachread.jp");
}

describe("MangaFlow MF-006 Workflow & Contract Gap Audit Tests", () => {
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  });

  beforeEach(async () => {
    await seedDatabase();
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

      // 1. POST new page to chapter
      const createRes = await request(createApp())
        .post("/api/chapters/ch-s-berserk-prod-4/pages")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .send({
          id: "pg-test-999",
          pageNumber: 1,
          imageUrl: "https://mock-s3-bucket.r2.cloudflarestorage.com/test-page-999.png",
          status: "UPLOADED",
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

      const editor = await loginAs("tanaka@beachread.jp");
      await request(createApp())
        .patch("/api/pages/pg-test-999")
        .set("Authorization", `Bearer ${editor.accessToken}`)
        .send({ imageUrl: "https://mock-s3-bucket.r2.cloudflarestorage.com/editor-edit.png" })
        .expect(403);

      const otherMangaka = await createAndLoginOtherMangaka();
      await request(createApp())
        .delete("/api/pages/pg-test-999")
        .set("Authorization", `Bearer ${otherMangaka.accessToken}`)
        .expect(403);

      // Workflow status must move via chapter/task/editor actions, not direct page patch.
      await request(createApp())
        .patch("/api/pages/pg-test-999")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .send({ status: "READY_FOR_EDITOR_REVIEW" })
        .expect(400);

      // 2. PATCH page asset metadata
      const patchRes = await request(createApp())
        .patch("/api/pages/pg-test-999")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .send({ imageUrl: "https://mock-s3-bucket.r2.cloudflarestorage.com/test-page-999-v2.png" })
        .expect(200);
      expect(patchRes.body.data.imageUrl).toBe(
        "https://mock-s3-bucket.r2.cloudflarestorage.com/test-page-999-v2.png",
      );

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
    it("allows only the owning Mangaka to manage assistant team members", async () => {
      const mangaka = await loginAs("inoue@beachread.jp");
      const editor = await loginAs("tanaka@beachread.jp");
      const otherMangaka = await createAndLoginOtherMangaka();

      await request(createApp())
        .post("/api/series/s-berserk-prod/members")
        .set("Authorization", `Bearer ${editor.accessToken}`)
        .send({
          userId: "u-assist-new",
          role: "assistant",
          scope: "Lineart only",
          status: "active",
        })
        .expect(403);

      await request(createApp())
        .post("/api/series/s-berserk-prod/members")
        .set("Authorization", `Bearer ${otherMangaka.accessToken}`)
        .send({
          userId: "u-assist-new",
          role: "assistant",
          scope: "Lineart only",
          status: "active",
        })
        .expect(403);

      // 1. Add a new assistant as a team member
      const createRes = await request(createApp())
        .post("/api/series/s-berserk-prod/members")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .send({
          userId: "u-assist-new",
          role: "assistant",
          scope: "Lineart only",
          status: "active",
        })
        .expect(201);

      expect(createRes.body.data.userId).toBe("u-assist-new");
      expect(createRes.body.data.scope).toBe("Lineart only");

      const memberId = createRes.body.data.id;

      // 2. GET members list
      const getRes = await request(createApp())
        .get("/api/series/s-berserk-prod/members")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .expect(200);
      expect(getRes.body.data.some((m: any) => m.id === memberId)).toBe(true);

      // 3. PATCH member status / scope
      const patchRes = await request(createApp())
        .patch(`/api/series/s-berserk-prod/members/${memberId}`)
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .send({ scope: "Full chapter", status: "inactive" })
        .expect(200);
      expect(patchRes.body.data.status).toBe("inactive");
      expect(patchRes.body.data.scope).toBe("Full chapter");

      // 4. DELETE member
      await request(createApp())
        .delete(`/api/series/s-berserk-prod/members/${memberId}`)
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .expect(200);

      // Verify deletion
      const verifyGetRes = await request(createApp())
        .get("/api/series/s-berserk-prod/members")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .expect(200);
      expect(verifyGetRes.body.data.some((m: any) => m.id === memberId)).toBe(false);
    });

    it("allows only the owning Mangaka to invite assistants", async () => {
      const mangaka = await loginAs("inoue@beachread.jp");
      const editor = await loginAs("tanaka@beachread.jp");
      const otherMangaka = await createAndLoginOtherMangaka();

      await request(createApp())
        .post("/api/series/s-berserk-prod/invites")
        .set("Authorization", `Bearer ${editor.accessToken}`)
        .send({ email: "hina@beachread.jp", scope: "Task only" })
        .expect(403);

      await request(createApp())
        .post("/api/series/s-berserk-prod/invites")
        .set("Authorization", `Bearer ${otherMangaka.accessToken}`)
        .send({ email: "hina@beachread.jp", scope: "Task only" })
        .expect(403);

      await SeriesMemberModel.deleteMany({ seriesId: "s-berserk-prod", userId: "u-assist-2" });
      await SeriesModel.updateOne({ id: "s-berserk-prod" }, { $pull: { assistantIds: "u-assist-2" } });

      const response = await request(createApp())
        .post("/api/series/s-berserk-prod/invites")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .send({ email: "hina@beachread.jp", scope: "Task only" })
        .expect(201);

      expect(response.body.data.userId).toBe("u-assist-2");
    });
  });

  describe("Series and Chapter owner guards", () => {
    it("allows only the owning Mangaka to patch basic Series fields", async () => {
      const mangaka = await loginAs("inoue@beachread.jp");
      const editor = await loginAs("tanaka@beachread.jp");
      const otherMangaka = await createAndLoginOtherMangaka();

      await request(createApp())
        .patch("/api/series/s-berserk-prod")
        .set("Authorization", `Bearer ${editor.accessToken}`)
        .send({ title: "Editor should not update" })
        .expect(403);

      await request(createApp())
        .patch("/api/series/s-berserk-prod")
        .set("Authorization", `Bearer ${otherMangaka.accessToken}`)
        .send({ title: "Other Mangaka should not update" })
        .expect(403);

      await request(createApp())
        .patch("/api/series/s-berserk-prod")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .send({ editorId: "u-mobile-editor" })
        .expect(400);

      const response = await request(createApp())
        .patch("/api/series/s-berserk-prod")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .send({ title: "Berserk Production Updated" })
        .expect(200);

      expect(response.body.data.title).toBe("Berserk Production Updated");
    });

    it("blocks manual Series lifecycle actions outside Board at-risk decisions", async () => {
      const admin = await loginAs("admin@beachread.jp");
      const editor = await loginAs("tanaka@beachread.jp");

      await request(createApp())
        .post("/api/series/s-berserk-prod/actions/ARCHIVE")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({})
        .expect(403);

      await request(createApp())
        .post("/api/series/s-berserk-prod/actions/UNPUBLISH")
        .set("Authorization", `Bearer ${editor.accessToken}`)
        .send({})
        .expect(403);

      await request(createApp())
        .delete("/api/series/s-berserk-prod")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .expect(403);
    });

    it("allows only the owning Mangaka to patch Chapter planning fields", async () => {
      const mangaka = await loginAs("inoue@beachread.jp");
      const editor = await loginAs("tanaka@beachread.jp");
      const otherMangaka = await createAndLoginOtherMangaka();

      await request(createApp())
        .patch("/api/chapters/ch-s-berserk-prod-4")
        .set("Authorization", `Bearer ${editor.accessToken}`)
        .send({ title: "Editor should not patch" })
        .expect(403);

      await request(createApp())
        .patch("/api/chapters/ch-s-berserk-prod-4")
        .set("Authorization", `Bearer ${otherMangaka.accessToken}`)
        .send({ title: "Other Mangaka should not patch" })
        .expect(403);

      await request(createApp())
        .patch("/api/chapters/ch-s-berserk-prod-4")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .send({ scheduledAt: "2026-07-01T00:00:00.000Z" })
        .expect(400);

      const response = await request(createApp())
        .patch("/api/chapters/ch-s-berserk-prod-4")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .send({ title: "Chapter planning update" })
        .expect(200);

      expect(response.body.data.title).toBe("Chapter planning update");
    });
  });

  describe("Task action states", () => {
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
        .post("/api/submissions")
        .set("Authorization", `Bearer ${assistant.accessToken}`)
        .send({ taskId: "tsk-submit-owned", intent: "SUBMIT", fileKey: "uploads/proof.png" })
        .expect(201);

      expect(res.body.data.assistantId).toBe(assistant.user.id);
      expect(res.body.data.status).toBe("PENDING");
      expect(res.body.data.version).toBe(1);
      expect(res.body.data.submittedAt).toBeDefined();
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

      // 2. SUBMIT action -> SUBMITTED
      const submitRes = await request(createApp())
        .post("/api/studio/tasks/tsk-transition-test/actions/submit")
        .set("Authorization", `Bearer ${assistant.accessToken}`)
        .expect(200);
      expect(submitRes.body.data.status).toBe("SUBMITTED");

      // 3. BLOCK action -> blocked: true
      const blockRes = await request(createApp())
        .post("/api/studio/tasks/tsk-transition-test/actions/block")
        .set("Authorization", `Bearer ${assistant.accessToken}`)
        .send({ reason: "Missing base layout storyboard" })
        .expect(200);
      expect(blockRes.body.data.blocked).toBe(true);
      expect(blockRes.body.data.blockedReason).toBe("Missing base layout storyboard");

      // 4. UNBLOCK action -> blocked: false
      const unblockRes = await request(createApp())
        .post("/api/studio/tasks/tsk-transition-test/actions/unblock")
        .set("Authorization", `Bearer ${assistant.accessToken}`)
        .expect(200);
      expect(unblockRes.body.data.blocked).toBe(false);
      expect(unblockRes.body.data.blockedReason).toBeNull();
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
      });

      const submission = await SubmissionModel.create({
        id: "sub-self-approve",
        taskId: "tsk-self-approve",
        chapterId: "ch-s-berserk-prod-4",
        assistantId: assistant.user.id,
        assistantName: "Jun",
        imageUrl: "https://mock-s3-bucket/sketch.png",
        status: "SUBMITTED",
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
  });

  describe("Mangaka sends a production chapter to Editor Review", () => {
    async function createReviewFixture(options?: {
      ownerId?: string;
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
        editorId: "u-editor",
        editorName: "Editor",
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
        status: options?.chapterStatus ?? "DRAFTING",
        assigneeId: ownerId,
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

      expect(response.body.data.nextStatus).toBe("EDITOR_REVIEW");
      expect(response.body.data.flow).toBe("DIRECT");
      expect(response.body.data.chapter.status).toBe("EDITOR_REVIEW");
      expect(response.body.data.pages[0].status).toBe("READY_FOR_EDITOR_REVIEW");
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
      expect((task as any).status).toBe("EDITOR_REVIEWING");
      expect((submission as any).reviewStage).toBe("EDITOR_REVIEW");
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

    it("blocks review materials that are not ACTIVE", async () => {
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
        .expect(409);
      expect(response.body.code).toBe("REVIEW_MATERIAL_NOT_ACTIVE");
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

    it("only exposes sent submissions in the Editor review queue", async () => {
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
      expect(ids).toContain(sent.submissionId);
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
      expect((approvedChapter as any).pages[0].status).toBe("EDITOR_APPROVED");
      expect((approvedTask as any).status).toBe("EDITOR_APPROVED");
      expect((approvedSubmission as any).status).toBe("EDITOR_APPROVED");

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
      expect((revisedChapter as any).status).toBe("IN_PRODUCTION");
      expect((revisedChapter as any).pages[0].status).toBe("REVISION_REQUIRED");
      expect((revisedTask as any).status).toBe("EDITOR_REVISION_REQUESTED");
      expect((revisedSubmission as any).status).toBe("EDITOR_REVISION_REQUESTED");
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
