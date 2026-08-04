import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import { ChapterModel, StudioRegionModel } from "../db/models.js";
import { seedDatabase } from "../seed.js";

let mongo: MongoMemoryServer;

async function loginAs(email: string, password = email) {
  const response = await request(createApp())
    .post("/api/auth/login")
    .send({ email, password })
    .expect(200);
  return response.body.data as { accessToken: string; user: { id: string; role: string } };
}

describe("Region API positive paths", () => {
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  });

  beforeEach(async () => {
    await seedDatabase();
    await ChapterModel.updateOne(
      { id: "ch-s-berserk-prod-5" },
      { $set: { status: "IN_PRODUCTION" } },
    );
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it("lets a Mangaka create, list, and update a region without linking a task", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const app = createApp();
    const auth = { Authorization: `Bearer ${mangaka.accessToken}` };

    const created = await request(app)
      .post("/api/studio/regions")
      .set(auth)
      .send({
        seriesId: "s-berserk-prod",
        chapterId: "ch-s-berserk-prod-5",
        pageId: "ch-s-berserk-prod-5-p1",
        type: "SPEECH_BUBBLE",
        x: 10,
        y: 20,
        width: 40,
        height: 30,
        label: "Bubble 1",
      })
      .expect(201);

    expect(created.body.data).toMatchObject({
      type: "SPEECH_BUBBLE",
      label: "Bubble 1",
      status: "CONFIRMED",
      lockStatus: "UNLOCKED",
    });
    expect(created.body.data.taskId).toBeUndefined();

    const listed = await request(app).get("/api/studio/regions").set(auth).expect(200);
    expect(listed.body.data.some((region: any) => region.id === created.body.data.id)).toBe(true);

    const patched = await request(app)
      .patch(`/api/studio/regions/${created.body.data.id}`)
      .set(auth)
      .send({ label: "Bubble 1 (revised)" })
      .expect(200);
    expect(patched.body.data.label).toBe("Bubble 1 (revised)");
  });

  it("allows an assistant to comment on a region and a Mangaka to reply", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const assistant = await loginAs("jun@beachread.jp");
    const app = createApp();

    const region = await request(app)
      .post("/api/studio/regions")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({
        seriesId: "s-berserk-prod",
        chapterId: "ch-s-berserk-prod-5",
        pageId: "ch-s-berserk-prod-5-p1",
        type: "DRAWING",
        x: 5,
        y: 5,
        width: 20,
        height: 20,
      })
      .expect(201);

    const comment = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({
        targetType: "REGION",
        targetId: region.body.data.id,
        body: "Can you clarify the line weight here?",
      })
      .expect(201);
    expect(comment.body.data).toMatchObject({
      targetType: "REGION",
      targetId: region.body.data.id,
      body: "Can you clarify the line weight here?",
      status: "OPEN",
    });

    const reply = await request(app)
      .post(`/api/comments/${comment.body.data.id}/replies`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ body: "Thicker line for the bubble border." })
      .expect(201);
    expect(reply.body.data).toMatchObject({ parentCommentId: comment.body.data.id });

    const listed = await request(app)
      .get("/api/comments")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .expect(200);
    expect(
      listed.body.data.some((item: any) => item.id === comment.body.data.id || item.parentCommentId === comment.body.data.id),
    ).toBe(true);
  });

  it("lets a Mangaka discard a region that has no task link", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const app = createApp();
    const auth = { Authorization: `Bearer ${mangaka.accessToken}` };

    const region = await request(app)
      .post("/api/studio/regions")
      .set(auth)
      .send({
        seriesId: "s-berserk-prod",
        chapterId: "ch-s-berserk-prod-5",
        pageId: "ch-s-berserk-prod-5-p2",
        type: "SFX",
        x: 1,
        y: 1,
        width: 10,
        height: 10,
      })
      .expect(201);

    await request(app)
      .delete(`/api/studio/regions/${region.body.data.id}`)
      .set(auth)
      .expect(200);
    expect(await StudioRegionModel.exists({ id: region.body.data.id })).toBeNull();
  });
});
