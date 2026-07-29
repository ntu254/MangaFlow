import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import {
  ChapterModel,
  MaterialModel,
  SeriesMemberModel,
  SeriesModel,
  StudioCommentModel,
  StudioTaskModel,
  SubmissionModel,
} from "../db/models.js";
import { seedDatabase } from "../seed.js";

let mongo: MongoMemoryServer;

async function loginAs(email: string) {
  const response = await request(createApp())
    .post("/api/auth/login")
    .send({ email, password: email })
    .expect(200);
  return response.body.data as { accessToken: string };
}

async function seedAssignmentFixture() {
  await SeriesModel.create({
    id: "series-removal",
    slug: "series-removal",
    title: "Assignment removal fixture",
    authorId: "u-mangaka",
    authorName: "Inoue Takehiko",
    editorId: "u-editor",
    editorName: "Tanaka Akira",
    assistantIds: ["u-assist"],
    status: "ONGOING",
  });
  await SeriesMemberModel.create([
    {
      id: "member-assistant-removal",
      seriesId: "series-removal",
      userId: "u-assist",
      role: "assistant",
      status: "active",
      assignedChapterIds: [],
      assignedTaskIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "member-editor-removal",
      seriesId: "series-removal",
      userId: "u-editor",
      role: "editor",
      status: "active",
      assignedChapterIds: [],
      assignedTaskIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
}

describe("assignment removal workload guards", () => {
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  });

  beforeEach(async () => {
    if (!mongoose.connection.db) throw new Error("Mongo not ready");
    await mongoose.connection.db.dropDatabase();
    await seedDatabase();
    await seedAssignmentFixture();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it("blocks Assistant removal and returns stable task blockers", async () => {
    await StudioTaskModel.create({
      id: "task-removal-open",
      seriesId: "series-removal",
      chapterId: "chapter-removal",
      assigneeId: "u-assist",
      status: "IN_PROGRESS",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const mangaka = await loginAs("inoue@beachread.jp");
    const response = await request(createApp())
      .delete("/api/series/series-removal/members/member-assistant-removal")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .expect(409);

    expect(response.body.code).toBe("ACTIVE_ASSIGNMENTS_EXIST");
    expect(response.body.data.blockers).toEqual([
      { kind: "TASK", id: "task-removal-open", status: "IN_PROGRESS" },
    ]);
    expect(await SeriesMemberModel.exists({ id: "member-assistant-removal" })).toBeTruthy();
    expect(await StudioTaskModel.exists({ id: "task-removal-open" })).toBeTruthy();
  });

  it("removes Assistant after all assigned tasks are terminal", async () => {
    await StudioTaskModel.create({
      id: "task-removal-cancelled",
      seriesId: "series-removal",
      assigneeId: "u-assist",
      status: "CANCELLED",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const mangaka = await loginAs("inoue@beachread.jp");
    await request(createApp())
      .delete("/api/series/series-removal/members/member-assistant-removal")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .expect(200);

    expect(await SeriesMemberModel.exists({ id: "member-assistant-removal" })).toBeNull();
    expect(await SeriesModel.exists({ id: "series-removal", assistantIds: "u-assist" })).toBeNull();
  });

  it("blocks Tantou removal for every open editorial workload category", async () => {
    await ChapterModel.create({
      id: "chapter-removal-review",
      seriesId: "series-removal",
      number: 1,
      title: "Review chapter",
      status: "TANTOU_REVIEW",
      pages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await StudioCommentModel.create({
      id: "comment-removal-blocker",
      seriesId: "series-removal",
      targetType: "CHAPTER",
      targetId: "chapter-removal-review",
      authorId: "u-editor",
      authorName: "Tanaka Akira",
      authorRole: "EDITOR",
      body: "Blocking issue",
      isBlocking: true,
      status: "OPEN",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await MaterialModel.create({
      id: "material-removal-review",
      seriesId: "series-removal",
      title: "Material under review",
      kind: "reference",
      status: "IN_REVIEW",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await SubmissionModel.create({
      id: "submission-removal-review",
      seriesId: "series-removal",
      status: "MANGAKA_APPROVED",
      reviewStage: "EDITOR_REVIEW",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const editorInChief = await loginAs("tanaka@beachread.jp");
    const response = await request(createApp())
      .delete("/api/series/series-removal/editor")
      .set("Authorization", `Bearer ${editorInChief.accessToken}`)
      .expect(409);

    expect(response.body.code).toBe("EDITOR_WORKLOAD_EXISTS");
    expect(response.body.data.blockers).toEqual([
      { kind: "CHAPTER", id: "chapter-removal-review", status: "TANTOU_REVIEW" },
      { kind: "COMMENT", id: "comment-removal-blocker", status: "OPEN" },
      { kind: "MATERIAL", id: "material-removal-review", status: "IN_REVIEW" },
      { kind: "SUBMISSION", id: "submission-removal-review", status: "MANGAKA_APPROVED" },
    ]);
    expect((await SeriesModel.findOne({ id: "series-removal" }).lean() as any)?.editorId).toBe("u-editor");
    expect((await SeriesMemberModel.findOne({ id: "member-editor-removal" }).lean() as any)?.status).toBe("active");
  });

  it("removes Tantou after the editorial workload is cleared", async () => {
    const editorInChief = await loginAs("tanaka@beachread.jp");
    await request(createApp())
      .delete("/api/series/series-removal/editor")
      .set("Authorization", `Bearer ${editorInChief.accessToken}`)
      .expect(200);

    expect(await SeriesMemberModel.findOne({ id: "member-editor-removal" }).lean()).toMatchObject({
      status: "inactive",
    });
    expect((await SeriesModel.findOne({ id: "series-removal" }).lean() as any)?.editorId).toBe("");
  });
});
