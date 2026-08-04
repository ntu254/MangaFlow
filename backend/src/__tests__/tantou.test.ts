import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import {
  ChapterModel,
  SeriesInviteModel,
  SeriesMemberModel,
  SeriesModel,
  StudioCommentModel,
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
  return response.body.data as { accessToken: string; user: { id: string; role: string } };
}

async function clearTantouWorkload(seriesId: string) {
  const taskIds = (await StudioTaskModel.find({ seriesId }).select({ id: 1 }).lean()).map(
    (task: any) => task.id,
  );
  await ChapterModel.updateMany(
    { seriesId, status: { $in: ["TANTOU_REVIEW", "REVISION_REQUIRED"] } },
    { $set: { status: "IN_PRODUCTION" } },
  );
  await StudioCommentModel.deleteMany({
    seriesId,
    isBlocking: true,
    status: { $in: ["OPEN", "REOPENED"] },
  });
  await SubmissionModel.updateMany(
    {
      $or: [{ seriesId }, { taskId: { $in: taskIds } }],
      status: "MANGAKA_APPROVED",
    },
    { $set: { status: "SUPERSEDED" } },
  );
}

describe("canonical team and Tantou workflow", () => {
  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongo.getUri());
  });

  beforeEach(async () => seedDatabase());

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it("allows only the owning Mangaka to assign a single active Tantou", async () => {
    const editor = await loginAs("editor@mangaflow.local");
    await request(createApp())
      .post("/api/series/s-berserk-prod/editor")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({ editorId: "u-mobile-editor" })
      .expect(403);

    const mangaka = await loginAs("inoue@beachread.jp");
    await request(createApp())
      .post("/api/series/s-berserk-prod/editor")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ editorId: "u-mobile-editor" })
      .expect(409);
  });

  it("rejects inactive or wrong-role Tantou targets", async () => {
    await clearTantouWorkload("s-berserk-prod");
    const mangaka = await loginAs("inoue@beachread.jp");
    await request(createApp())
      .delete("/api/series/s-berserk-prod/editor")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .expect(200);

    await request(createApp())
      .post("/api/series/s-berserk-prod/editor")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ editorId: "u-mangaka" })
      .expect(400);
  });

  it("does not remove Tantou while review workload exists", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    await request(createApp())
      .delete("/api/series/s-berserk-prod/editor")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .expect(409);
  });

  it("requires Assistant acceptance before membership becomes active", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const invite = await request(createApp())
      .post("/api/series/s-berserk-prod/invites")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ email: "hina@beachread.jp", scope: "Task only" })
      .expect(201);
    expect(invite.body.data.status).toBe("PENDING");

    const assistant = await loginAs("hina@beachread.jp");
    const pending = await request(createApp())
      .get("/api/series/invites")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .expect(200);
    expect(pending.body.data).toHaveLength(1);

    await request(createApp())
      .post(`/api/series/invites/${invite.body.data.id}/accept`)
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .expect(201);

    const members = await request(createApp())
      .get("/api/series/s-berserk-prod/members")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .expect(200);
    expect(members.body.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ userId: "u-assist-2", role: "assistant", status: "active" }),
    ]));
    expect(await SeriesInviteModel.countDocuments({ id: invite.body.data.id, status: "ACCEPTED" })).toBe(1);
  });

  it("retires direct member creation", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    await request(createApp())
      .post("/api/series/s-berserk-prod/members")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ userId: "u-assist-2" })
      .expect(410);
  });

  it("does not activate an invite after the Series is archived", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const invite = await request(createApp())
      .post("/api/series/s-berserk-prod/invites")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ email: "hina@beachread.jp", scope: "Task only" })
      .expect(201);

    await SeriesModel.updateOne({ id: "s-berserk-prod" }, { $set: { status: "ARCHIVED" } });
    const assistant = await loginAs("hina@beachread.jp");
    const response = await request(createApp())
      .post(`/api/series/invites/${invite.body.data.id}/accept`)
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .expect(409);

    expect(response.body.code).toBe("SERIES_NOT_ACCEPTING_MEMBERS");
    expect(await SeriesInviteModel.exists({ id: invite.body.data.id, status: "PENDING" })).toBeTruthy();
    expect(
      await SeriesMemberModel.exists({ seriesId: "s-berserk-prod", userId: "u-assist-2", role: "assistant" }),
    ).toBeNull();
  });
});
