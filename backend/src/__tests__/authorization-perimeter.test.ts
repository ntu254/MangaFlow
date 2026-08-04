import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import bcrypt from "bcryptjs";
import { createApp } from "../app.js";
import { seedDatabase } from "../seed.js";
import {
  MaterialModel,
  ChapterModel,
  SeriesModel,
  StudioCommentModel,
  StudioTaskModel,
  SubmissionModel,
  UserModel,
} from "../db/models.js";

let mongo: MongoMemoryReplSet;

async function loginAs(email: string, password = email) {
  const response = await request(createApp())
    .post("/api/auth/login")
    .send({ email, password })
    .expect(200);
  return response.body.data as {
    accessToken: string;
    user: { id: string; role: string };
  };
}

describe("authorization perimeter", () => {
  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongo.getUri());
  }, 30_000);

  beforeEach(async () => {
    await seedDatabase();
    await ChapterModel.updateOne(
      { id: "ch-s-berserk-prod-5" },
      {
        $set: {
          status: "IN_PRODUCTION",
          "pages.$[].status": "UPLOADED",
          "pages.$[].fileKey": "tests/source-page.jpg",
        },
      },
    );
  }, 30_000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  }, 30_000);

  it("blocks proposal detail and frozen versions outside proposal visibility", async () => {
    const assistant = await loginAs("jun@beachread.jp");

    await request(createApp())
      .get("/api/proposals/p-001")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .expect(403);

    await request(createApp())
      .get("/api/proposals/p-001/versions")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .expect(403);
  });

  it("blocks mobile governance aliases for roles outside the alias audience", async () => {
    const assistant = await loginAs("jun@beachread.jp");

    await request(createApp())
      .get("/api/board/queue")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .expect(403);

    await request(createApp())
      .get("/api/editor/proposals/review-queue")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .expect(403);
  });

  it("requires the assigned Tantou editor for chapter editorial actions", async () => {
    const otherEditor = await loginAs("editor@mangaflow.local");

    await request(createApp())
      .post("/api/chapters/ch-s-berserk-prod-5/actions/EDITOR_APPROVE")
      .set("Authorization", `Bearer ${otherEditor.accessToken}`)
      .send({})
      .expect(403)
      .expect((res) => {
        expect(res.body.code).toBe("TANTOU_ASSIGNMENT_REQUIRED");
      });
  });

  it("returns a Mangaka ownership code for chapter actions", async () => {
    await UserModel.create({
      id: "u-action-other-mangaka",
      name: "Other Action Mangaka",
      email: "other-action-mangaka@test.local",
      passwordHash: await bcrypt.hash("other-action-mangaka@test.local", 10),
      role: "MANGAKA",
      active: true,
    });
    const otherMangaka = await loginAs("other-action-mangaka@test.local");

    await request(createApp())
      .post("/api/chapters/ch-s-berserk-prod-5/actions/START_DRAFT")
      .set("Authorization", `Bearer ${otherMangaka.accessToken}`)
      .send({})
      .expect(403)
      .expect((res) => {
        expect(res.body.code).toBe("MANGAKA_OWNER_REQUIRED");
      });
  });

  it("requires series assignment before an editor can mutate series metadata", async () => {
    const otherEditor = await loginAs("editor@mangaflow.local");

    await request(createApp())
      .patch("/api/series/s-berserk-prod")
      .set("Authorization", `Bearer ${otherEditor.accessToken}`)
      .send({ title: "Cross-assigned edit" })
      .expect(403);
  });

  it("rejects Tantou and assistant assignment through the generic series patch API", async () => {
    const owner = await loginAs("inoue@beachread.jp");

    await request(createApp())
      .patch("/api/series/s-berserk-prod")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ editorId: "u-mobile-editor", assistantIds: ["u-assist-2"] })
      .expect(400);
  });

  it("rejects assigning a task to someone other than the page's assigned assistant", async () => {
    const owner = await loginAs("inoue@beachread.jp");

    await request(createApp())
      .post("/api/studio/pages/ch-s-berserk-prod-5-p1/assignment")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ assistantId: "u-assist" })
      .expect(201);

    const response = await request(createApp())
      .post("/api/studio/tasks")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({
        chapterId: "ch-s-berserk-prod-5",
        pageId: "ch-s-berserk-prod-5-p1",
        assigneeId: "u-editor",
        title: "Invalid editor assignment",
      })
      .expect(409);

    expect(response.body.code).toBe("PAGE_ASSIGNMENT_MISMATCH");
  });

  it("rejects assigning a page to a user who is not an active assistant series member", async () => {
    const owner = await loginAs("inoue@beachread.jp");

    const response = await request(createApp())
      .post("/api/studio/pages/ch-s-berserk-prod-5-p1/assignment")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ assistantId: "u-editor" })
      .expect(403);

    expect(response.body.code).toBe("ASSIGNEE_NOT_ELIGIBLE");
  });

  it("rejects a task whose declared series conflicts with its chapter", async () => {
    const owner = await loginAs("inoue@beachread.jp");

    const response = await request(createApp())
      .post("/api/studio/tasks")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({
        seriesId: "s-vinland-prod",
        chapterId: "ch-s-berserk-prod-5",
        pageId: "ch-s-berserk-prod-5-p1",
        assigneeId: "u-assist-2",
        title: "Conflicting task scope",
      })
      .expect(400);

    expect(response.body.code).toBe("TARGET_MISMATCH");
  });

  it("rejects an unresolved secondary task target", async () => {
    const owner = await loginAs("inoue@beachread.jp");

    const response = await request(createApp())
      .post("/api/studio/tasks")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({
        regionId: "reg-001",
        pageId: "missing-page",
        assigneeId: "u-assist",
        title: "Task with missing page",
      })
      .expect(400);

    expect(response.body.code).toBe("REGION_TASKS_RETIRED");
  });

  it("rejects reassigning a task to a non-assistant series member", async () => {
    const owner = await loginAs("inoue@beachread.jp");

    const response = await request(createApp())
      .post("/api/studio/tasks/tsk-002/actions/REASSIGN")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ newAssigneeId: "u-editor" })
      .expect(403);

    expect(response.body.code).toBe("ASSIGNEE_NOT_ELIGIBLE");
  });

  it("retires bulk task patching", async () => {
    const owner = await loginAs("inoue@beachread.jp");

    const response = await request(createApp())
      .patch("/api/studio/tasks")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ id: "tsk-002", status: "MANGAKA_APPROVED" })
      .expect(410);

    expect(response.body.code).toBe("ENDPOINT_DEPRECATED");
  });

  it("rejects direct task assignment and region changes", async () => {
    const owner = await loginAs("inoue@beachread.jp");

    const response = await request(createApp())
      .patch("/api/studio/tasks/tsk-002")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ assigneeId: "u-assist-2", regionId: "reg-001" })
      .expect(400);

    expect(response.body.code).toBe("PROTECTED_FIELD");
  });

  it("rejects direct task status changes", async () => {
    const owner = await loginAs("inoue@beachread.jp");

    const response = await request(createApp())
      .patch("/api/studio/tasks/tsk-002")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ status: "MANGAKA_APPROVED" })
      .expect(400);

    expect(response.body.code).toBe("VALIDATION_ERROR");
  });

  it("rejects moving a task outside its assignee membership", async () => {
    const owner = await loginAs("inoue@beachread.jp");

    const response = await request(createApp())
      .patch("/api/studio/tasks/tsk-003")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({
        seriesId: "s-berserk-prod",
        chapterId: "ch-s-berserk-prod-5",
        pageId: "ch-s-berserk-prod-5-p1",
      })
      .expect(400);

    expect(response.body.code).toBe("TARGET_MISMATCH");
  });

  it("keeps task comments scoped to the assigned assistant", async () => {
    const otherAssistant = await loginAs("hina@beachread.jp");

    await request(createApp())
      .get("/api/comments/task/tsk-001")
      .set("Authorization", `Bearer ${otherAssistant.accessToken}`)
      .expect(403);
  });

  it("prevents a Mangaka from creating a blocking comment", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");

    const response = await request(createApp())
      .post("/api/comments")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ seriesId: "s-berserk-prod", body: "Must be changed", isBlocking: true })
      .expect(403);

    expect(response.body.code).toBe("TANTOU_ASSIGNMENT_REQUIRED");
  });

  it("prevents a Mangaka from making an existing comment blocking", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    await StudioCommentModel.create({
      id: "cmt-mangaka-nonblocking",
      seriesId: "s-berserk-prod",
      authorId: mangaka.user.id,
      authorName: "Inoue Takehiko",
      authorRole: "MANGAKA",
      body: "Suggestion",
      isBlocking: false,
      status: "OPEN",
    });

    const response = await request(createApp())
      .patch("/api/comments/cmt-mangaka-nonblocking")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ isBlocking: true })
      .expect(403);

    expect(response.body.code).toBe("TANTOU_ASSIGNMENT_REQUIRED");
  });

  it("allows the assigned Tantou to block task and submission targets through their chapter", async () => {
    const editor = await loginAs("tanaka@beachread.jp");
    await StudioTaskModel.create({
      id: "tsk-comment-target-link",
      chapterId: "ch-s-berserk-prod-5",
      title: "Chapter-only task",
      assigneeId: "u-assist",
      status: "TODO",
    });
    await SubmissionModel.create({
      id: "sub-comment-target-link",
      taskId: "tsk-comment-target-link",
      chapterId: "ch-s-berserk-prod-5",
      assistantId: "u-assist",
      status: "PENDING",
    });

    for (const [targetType, targetId] of [
      ["TASK", "tsk-comment-target-link"],
      ["SUBMISSION", "sub-comment-target-link"],
    ]) {
      await request(createApp())
        .post("/api/comments")
        .set("Authorization", `Bearer ${editor.accessToken}`)
        .send({ targetType, targetId, body: "Assigned Tantou blocker", isBlocking: true })
        .expect(201);
    }
  });

  it("requires an assigned Tantou to resolve or reopen blocking comments", async () => {
    const unassignedEditor = await loginAs("editor@mangaflow.local");
    const seriesId = "s-comment-without-editor";
    await SeriesModel.create({
      id: seriesId,
      slug: seriesId,
      title: "Unassigned comment series",
      authorId: "u-mangaka",
      authorName: "Inoue Takehiko",
      status: "PLANNING",
    });
    await StudioCommentModel.insertMany([
      {
        id: "cmt-unassigned-resolve",
        seriesId,
        authorId: "u-editor",
        authorName: "Tanaka Akira",
        authorRole: "EDITOR",
        body: "Blocking review note",
        isBlocking: true,
        status: "OPEN",
      },
      {
        id: "cmt-unassigned-reopen",
        seriesId,
        authorId: "u-editor",
        authorName: "Tanaka Akira",
        authorRole: "EDITOR",
        body: "Blocking review note",
        isBlocking: true,
        status: "ADDRESSED",
      },
    ]);

    for (const [commentId, action] of [
      ["cmt-unassigned-resolve", "resolve"],
      ["cmt-unassigned-reopen", "reopen"],
    ]) {
      const response = await request(createApp())
        .post(`/api/comments/${commentId}/${action}`)
        .set("Authorization", `Bearer ${unassignedEditor.accessToken}`)
        .send({})
        .expect(403);

      expect(response.body.code).toBe("TANTOU_ASSIGNMENT_REQUIRED");
    }
  });

  it("rejects reopening an open blocking comment", async () => {
    const editor = await loginAs("tanaka@beachread.jp");
    await StudioCommentModel.create({
      id: "cmt-open-reopen",
      seriesId: "s-berserk-prod",
      authorId: editor.user.id,
      authorName: "Tanaka Akira",
      authorRole: "EDITOR",
      body: "Blocking review note",
      isBlocking: true,
      status: "OPEN",
    });

    const response = await request(createApp())
      .post("/api/comments/cmt-open-reopen/reopen")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({})
      .expect(409);

    expect(response.body.code).toBe("INVALID_TRANSITION");
  });

  it("keeps list comments scoped in the database query, including pagination totals", async () => {
    await StudioCommentModel.insertMany(
      Array.from({ length: 4 }, (_, index) => ({
        id: `cmt-private-${index}`,
        seriesId: "s-berserk-prod",
        chapterId: "ch-s-berserk-prod-5",
        taskId: "tsk-001",
        targetType: "TASK",
        targetId: "tsk-001",
        authorId: "u-editor",
        authorName: "Tanaka Akira",
        body: `Private editor note ${index}`,
        text: `Private editor note ${index}`,
        status: "OPEN",
        createdAt: new Date(Date.now() + index),
      })),
    );
    const otherAssistant = await loginAs("hina@beachread.jp");

    const response = await request(createApp())
      .get("/api/comments")
      .query({ taskId: "tsk-001", limit: 2 })
      .set("Authorization", `Bearer ${otherAssistant.accessToken}`)
      .expect(200);

    expect(response.body.data).toEqual([]);
    expect(response.body.pagination.total).toBe(0);
  });

  it("requires the owning Mangaka before reviewing an assistant submission", async () => {
    await UserModel.create({
      id: "u-other-mangaka",
      name: "Other Mangaka",
      email: "other-mangaka@test.local",
      passwordHash: await bcrypt.hash("other-mangaka@test.local", 10),
      role: "MANGAKA",
      active: true,
    });
    await StudioTaskModel.create({
      id: "tsk-cross-owner",
      seriesId: "s-berserk-prod",
      chapterId: "ch-s-berserk-prod-5",
      title: "Cross owner task",
      type: "cleanup",
      assigneeId: "u-assist",
      assigneeName: "Suzuki Jun",
      status: "SUBMITTED",
      currentSubmissionId: "sub-cross-owner",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await SubmissionModel.create({
      id: "sub-cross-owner",
      taskId: "tsk-cross-owner",
      seriesId: "s-berserk-prod",
      chapterId: "ch-s-berserk-prod-5",
      assistantId: "u-assist",
      assistantName: "Suzuki Jun",
      status: "PENDING",
      submittedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const otherMangaka = await loginAs("other-mangaka@test.local");

    await request(createApp())
      .post("/api/submissions/sub-cross-owner/approve")
      .set("Authorization", `Bearer ${otherMangaka.accessToken}`)
      .send({ reviewerNote: "Looks fine" })
      .expect(403)
      .expect((res) => {
        expect(res.body.code).toBe("MANGAKA_OWNER_REQUIRED");
      });
  });

  it("scopes material reads and writes to the record owner perimeter", async () => {
    const otherEditor = await loginAs("editor@mangaflow.local");
    await MaterialModel.create({
      id: "mat-private-series",
      seriesId: "s-berserk-prod",
      scope: "SERIES",
      ownerType: "series",
      ownerId: "s-berserk-prod",
      title: "Private board",
      kind: "reference",
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const listResponse = await request(createApp())
      .get("/api/materials")
      .query({ seriesId: "s-berserk-prod" })
      .set("Authorization", `Bearer ${otherEditor.accessToken}`)
      .expect(200);

    expect(listResponse.body.data.map((item: any) => item.id)).not.toContain("mat-private-series");

    await request(createApp())
      .patch("/api/materials/mat-private-series")
      .set("Authorization", `Bearer ${otherEditor.accessToken}`)
      .send({ title: "Cross editor update" })
      .expect(403);
  });

  it("requires proposal visibility before exposing mobile board votes", async () => {
    const board = await loginAs("board@beachread.jp");

    await request(createApp())
      .get("/api/board/series/p-001/votes")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .expect(403);
  });

  it("removed admin material library routes return 404", async () => {
    const admin = await loginAs("admin@beachread.jp");

    await request(createApp())
      .get("/api/admin/materials")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .expect(404);

    await request(createApp())
      .post("/api/admin/materials")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .field("title", "Admin style sheet")
      .attach("file", Buffer.from("material"), "style.txt")
      .expect(404);

    await request(createApp())
      .post("/api/admin/materials/mat-any/replace")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .attach("file", Buffer.from("material-v2"), "style-v2.txt")
      .expect(404);

    await request(createApp())
      .post("/api/admin/materials/mat-any/archive")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({ reason: "Cleanup" })
      .expect(404);

    await request(createApp())
      .post("/api/admin/materials/mat-any/restore")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({ reason: "Needed again" })
      .expect(404);
  });
});
