import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import {
  AuditEntryModel,
  ChapterModel,
  EarningModel,
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
  return response.body.data as { accessToken: string; user: { id: string; role: string } };
}

const TASK_ID = "tsk-001";

async function markTaskMangakaApproved() {
  await StudioTaskModel.updateOne(
    { id: TASK_ID },
    {
      $set: {
        status: "MANGAKA_APPROVED",
        mangakaReviewedAt: new Date(),
        mangakaReviewedById: "u-mangaka",
        updatedAt: new Date(),
      },
    },
  );
}

describe("ASN-002 — Editor task approval transition", () => {
  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongo.getUri());
  }, 30_000);

  beforeEach(async () => {
    await seedDatabase();
    await markTaskMangakaApproved();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it("moves a MANGAKA_APPROVED task to EDITOR_APPROVED via EDITOR_APPROVE action", async () => {
    const editor = await loginAs("tanaka@beachread.jp");
    const app = createApp();

    const response = await request(app)
      .post(`/api/studio/tasks/${TASK_ID}/actions/EDITOR_APPROVE`)
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({})
      .expect(200);

    expect(response.body.data).toMatchObject({ status: "EDITOR_APPROVED" });

    const updated = await StudioTaskModel.findOne({ id: TASK_ID }).lean();
    expect((updated as any).status).toBe("EDITOR_APPROVED");
    expect((updated as any).editorApprovedAt).toBeTruthy();
    expect((updated as any).editorApprovedById).toBe("u-editor");

    const auditCount = await AuditEntryModel.countDocuments({
      entityType: "task",
      entityId: TASK_ID,
      action: "task.editor_approve",
    });
    expect(auditCount).toBeGreaterThan(0);
  });

  it("records an earning exactly once when an editor completes the task", async () => {
    const submission = await SubmissionModel.findOne({ taskId: TASK_ID }).lean();
    expect(submission).toBeTruthy();

    await StudioTaskModel.updateOne(
      { id: TASK_ID },
      { $set: { currentSubmissionId: submission?.id } },
    );

    const editor = await loginAs("tanaka@beachread.jp");
    const app = createApp();

    const response = await request(app)
      .post(`/api/studio/tasks/${TASK_ID}/actions/EDITOR_APPROVE`)
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({})
      .expect(200);

    const earningsBefore = await mongoose.connection
      .collection("earningitems")
      .countDocuments({ taskId: TASK_ID });

    const complete = await request(app)
      .post(`/api/studio/tasks/${TASK_ID}/actions/COMPLETE`)
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({})
      .expect(200);

    expect(complete.body.data).toMatchObject({ status: "COMPLETED" });

    const earningsAfter = await mongoose.connection
      .collection("earningitems")
      .countDocuments({ taskId: TASK_ID });
    // Earnings are recorded once per (task, submission). The COMPLETE action
    // must not double-write.
    expect(earningsAfter).toBe(earningsBefore);

    const auditCount = await AuditEntryModel.countDocuments({
      entityType: "task",
      entityId: TASK_ID,
      action: "task.complete",
    });
    expect(auditCount).toBeGreaterThan(0);
  });

  it("forbids Assistant from running EDITOR_APPROVE", async () => {
    const assistant = await loginAs("jun@beachread.jp");
    const app = createApp();

    const response = await request(app)
      .post(`/api/studio/tasks/${TASK_ID}/actions/EDITOR_APPROVE`)
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({})
      .expect(403);

    expect(response.body.code).toBe("FORBIDDEN");
  });

  it("rejects EDITOR_APPROVE when task is not MANGAKA_APPROVED", async () => {
    await StudioTaskModel.updateOne({ id: TASK_ID }, { $set: { status: "TODO" } });
    const editor = await loginAs("tanaka@beachread.jp");
    const app = createApp();

    const response = await request(app)
      .post(`/api/studio/tasks/${TASK_ID}/actions/EDITOR_APPROVE`)
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({})
      .expect(409);

    expect(response.body.code).toBe("INVALID_TRANSITION");
  });
});