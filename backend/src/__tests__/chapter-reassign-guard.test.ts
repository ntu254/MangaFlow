import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import { ChapterModel, SeriesMemberModel } from "../db/models.js";
import { seedDatabase } from "../seed.js";

let mongo: MongoMemoryReplSet;

async function loginAs(email: string, password = email) {
  const response = await request(createApp())
    .post("/api/auth/login")
    .send({ email, password })
    .expect(200);
  return response.body.data as { accessToken: string; user: { id: string; role: string } };
}

async function setChapterStatus(chapterId: string, status: string) {
  await ChapterModel.updateOne({ id: chapterId }, { $set: { status, updatedAt: new Date() } });
}

describe("WF-004 — REASSIGN state guard", () => {
  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongo.getUri());
  }, 30_000);

  beforeEach(async () => {
    await seedDatabase();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it.each([
    ["IN_PRODUCTION"],
    ["REVISION_REQUIRED"],
  ])("allows REASSIGN when chapter is %s", async (status) => {
    const chapterId = `ch-test-${status.toLowerCase()}`;
    await SeriesMemberModel.deleteMany({ userId: "u-assist" });
    await ChapterModel.create({
      id: chapterId,
      seriesId: "s-berserk-prod",
      number: 99,
      title: `Test chapter ${status}`,
      status,
      assigneeId: "u-mangaka",
      assigneeName: "Inoue Takehiko",
      pages: [],
      reviewNotes: [],
      revisionRound: 0,
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await SeriesMemberModel.create({
      id: "sm-assist-1",
      seriesId: "s-berserk-prod",
      userId: "u-assist",
      role: "assistant",
      status: "active",
      assignedChapterIds: [],
      assignedTaskIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const mangaka = await loginAs("inoue@beachread.jp");
    const app = createApp();

    const response = await request(app)
      .post(`/api/chapters/${chapterId}/actions/REASSIGN`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ newAssigneeId: "u-assist", reason: "Workload rebalance" })
      .expect(200);

    expect(response.body.data).toMatchObject({ assigneeId: "u-assist" });
  });

  it.each([
    ["TANTOU_REVIEW"],
    ["READY_FOR_PUBLICATION"],
    ["PUBLISHED"],
  ])("blocks REASSIGN when chapter is %s (REASSIGN_NOT_ALLOWED_IN_STATE)", async (status) => {
    const chapterId = `ch-test-block-${status.toLowerCase()}`;
    await ChapterModel.create({
      id: chapterId,
      seriesId: "s-berserk-prod",
      number: 100,
      title: `Test chapter blocked ${status}`,
      status,
      assigneeId: "u-mangaka",
      assigneeName: "Inoue Takehiko",
      pages: [],
      reviewNotes: [],
      revisionRound: 0,
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const mangaka = await loginAs("inoue@beachread.jp");
    const app = createApp();

    const response = await request(app)
      .post(`/api/chapters/${chapterId}/actions/REASSIGN`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ newAssigneeId: "u-assist", reason: "Too late" })
      .expect(409);

    expect(response.body.code).toBe("REASSIGN_NOT_ALLOWED");
  });

  it("only allows REASSIGN through the dedicated assigment flow on PLANNED chapters", async () => {
    const chapterId = "ch-test-planned-1";
    await ChapterModel.create({
      id: chapterId,
      seriesId: "s-berserk-prod",
      number: 101,
      title: "Planned chapter",
      status: "PLANNED",
      assigneeId: "u-mangaka",
      assigneeName: "Inoue Takehiko",
      pages: [],
      reviewNotes: [],
      revisionRound: 0,
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const mangaka = await loginAs("inoue@beachread.jp");
    const app = createApp();

    // REASSIGN is allowed at PLANNED but the assignee must be an active
    // member of the series (u-assist is). Earlier versions of this guard
    // required IN_PRODUCTION; the regression test asserts the wider
    // PLANNED/IN_PRODUCTION/REVISION_REQUIRED window.
    const response = await request(app)
      .post(`/api/chapters/${chapterId}/actions/REASSIGN`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ newAssigneeId: "u-assist", reason: "Planned reassignment" })
      .expect(200);

    expect(response.body.data).toMatchObject({ assigneeId: "u-assist" });
  });
});