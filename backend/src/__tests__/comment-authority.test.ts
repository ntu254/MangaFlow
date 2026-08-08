import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import { seedDatabase } from "../seed.js";
import { SeriesModel, ChapterModel, StudioCommentModel } from "../db/models.js";

let mongo: MongoMemoryServer;
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});
beforeEach(async () => {
  if (!mongoose.connection.db) throw new Error("Mongo not ready");
  await mongoose.connection.db.dropDatabase();
  await seedDatabase();
  await SeriesModel.create({
    id: "s-ct01",
    slug: "s-ct01",
    title: "CT01",
    authorId: "u-mangaka",
    authorName: "Inoue",
    editorId: "u-mobile-editor",
    status: "ONGOING",
  });
  await ChapterModel.create({
    id: "ch-ct01",
    seriesId: "s-ct01",
    number: 1,
    title: "Ch1",
    status: "IN_PRODUCTION",
    pages: [],
  });
});
async function loginAs(email: string) {
  const res = await request(createApp()).post("/api/auth/login").send({ email, password: email });
  return res.body.data as { accessToken: string };
}
const blockingBody = {
  targetType: "CHAPTER",
  targetId: "ch-ct01",
  chapterId: "ch-ct01",
  seriesId: "s-ct01",
  body: "Blocker",
  isBlocking: true,
};

describe("CT-01 blocking-comment authority", () => {
  it("rejects a non-Tantou creating a blocking comment (403 TANTOU_ASSIGNMENT_REQUIRED)", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const res = await request(createApp())
      .post("/api/comments")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send(blockingBody)
      .expect(403);
    expect(res.body.code).toBe("TANTOU_ASSIGNMENT_REQUIRED");
    expect(await StudioCommentModel.countDocuments({ chapterId: "ch-ct01", isBlocking: true })).toBe(0);
  });
  it("allows the assigned Tantou to create a blocking comment", async () => {
    const editor = await loginAs("editor@mangaflow.local");
    const res = await request(createApp())
      .post("/api/comments")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({ ...blockingBody, x: 0.25, y: 0.75 })
      .expect(201);
    expect(res.body.data.isBlocking).toBe(true);
    expect(res.body.data.x).toBe(0.25);
    expect(res.body.data.y).toBe(0.75);
  });
  it("allows any otherwise-authorized actor to create a non-blocking comment", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    await request(createApp())
      .post("/api/comments")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ ...blockingBody, isBlocking: false })
      .expect(201);
  });
  it("rejects a non-Tantou patch that raises a comment to blocking", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const created = await request(createApp())
      .post("/api/comments")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ ...blockingBody, isBlocking: false })
      .expect(201);
    await request(createApp())
      .patch(`/api/comments/${created.body.data.id}`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ isBlocking: true })
      .expect(403);
  });
  it("rejects legacy blocking fields and FIXED status values at the API boundary", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");

    const legacyBlocking = await request(createApp())
      .post("/api/comments")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ ...blockingBody, blocking: true })
      .expect(400);
    expect(legacyBlocking.body.code).toBe("VALIDATION_ERROR");

    const legacyStatus = await request(createApp())
      .post("/api/comments")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ ...blockingBody, status: "FIXED" })
      .expect(400);
    expect(legacyStatus.body.code).toBe("VALIDATION_ERROR");
  });
});

describe("CT-03 resolve/reopen authority", () => {
  beforeEach(async () => {
    await StudioCommentModel.create({
      id: "cmt-ct03",
      seriesId: "s-ct01",
      chapterId: "ch-ct01",
      targetType: "CHAPTER",
      targetId: "ch-ct01",
      authorId: "u-mobile-editor",
      authorName: "Mobile Editor",
      authorRole: "EDITOR",
      body: "block",
      text: "block",
      isBlocking: true,
      status: "OPEN",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it("rejects an EDITOR who is not the assigned Tantou", async () => {
    const editor = await loginAs("tanaka@beachread.jp");
    const res = await request(createApp())
      .post("/api/comments/cmt-ct03/resolve")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({})
      .expect(403);
    expect(res.body.code).toBe("TANTOU_ASSIGNMENT_REQUIRED");
  });

  it("rejects an unassigned EDITOR reopening a resolved comment", async () => {
    await StudioCommentModel.updateOne(
      { id: "cmt-ct03" },
      { $set: { status: "RESOLVED" } },
    );
    const editor = await loginAs("tanaka@beachread.jp");
    const res = await request(createApp())
      .post("/api/comments/cmt-ct03/reopen")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({})
      .expect(403);
    expect(res.body.code).toBe("TANTOU_ASSIGNMENT_REQUIRED");
  });

  it("rejects Assistant resolve at the route perimeter", async () => {
    const assistant = await loginAs("jun@beachread.jp");
    await request(createApp())
      .post("/api/comments/cmt-ct03/resolve")
      .set("Authorization", `Bearer ${assistant.accessToken}`)
      .send({})
      .expect(403);
  });

  it("rejects Mangaka reopen at the route perimeter", async () => {
    await StudioCommentModel.updateOne(
      { id: "cmt-ct03" },
      { $set: { status: "RESOLVED" } },
    );
    const mangaka = await loginAs("inoue@beachread.jp");
    await request(createApp())
      .post("/api/comments/cmt-ct03/reopen")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({})
      .expect(403);
  });

  it("rejects resolve when the Series has no assigned Tantou", async () => {
    await SeriesModel.create({
      id: "s-noeditor",
      slug: "s-noeditor",
      title: "NoEd",
      authorId: "u-mangaka",
      authorName: "Inoue",
      status: "ONGOING",
    });
    await StudioCommentModel.create({
      id: "cmt-noed",
      seriesId: "s-noeditor",
      targetType: "CHAPTER",
      targetId: "ch-x",
      authorId: "u-mobile-editor",
      authorName: "Mobile Editor",
      authorRole: "EDITOR",
      body: "block",
      text: "block",
      isBlocking: true,
      status: "OPEN",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const editor = await loginAs("editor@mangaflow.local");
    const res = await request(createApp())
      .post("/api/comments/cmt-noed/resolve")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({})
      .expect(403);
    expect(res.body.code).toBe("TANTOU_ASSIGNMENT_REQUIRED");
  });

  it("lets the assigned Tantou resolve a blocking comment", async () => {
    const editor = await loginAs("editor@mangaflow.local");
    const res = await request(createApp())
      .post("/api/comments/cmt-ct03/resolve")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({})
      .expect(200);
    expect(res.body.data.status).toBe("RESOLVED");
  });

  it("rejects reopen from OPEN and allows reopen from RESOLVED", async () => {
    const editor = await loginAs("editor@mangaflow.local");
    const reopenOpen = await request(createApp())
      .post("/api/comments/cmt-ct03/reopen")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({})
      .expect(409);
    expect(reopenOpen.body.code).toBe("INVALID_TRANSITION");

    await request(createApp())
      .post("/api/comments/cmt-ct03/resolve")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({})
      .expect(200);
    const reopened = await request(createApp())
      .post("/api/comments/cmt-ct03/reopen")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({})
      .expect(200);
    expect(reopened.body.data.status).toBe("REOPENED");
  });
});
