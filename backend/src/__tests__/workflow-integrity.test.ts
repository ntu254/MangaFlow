import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import {
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
      .post("/api/series/s-berserk-prod/actions/ARCHIVE")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({})
      .expect(409);

    expect(response.body.code).toBe("INVALID_TRANSITION");
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
