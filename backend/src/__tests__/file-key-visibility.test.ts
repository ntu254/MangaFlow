import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { createApp } from "../app.js";
import { seedDatabase } from "../seed.js";
import {
  ChapterModel,
  MaterialModel,
  ProposalModel,
  SeriesModel,
  StudioTaskModel,
  SubmissionModel,
} from "../db/models.js";

let mongo: MongoMemoryReplSet;

async function loginAs(email: string) {
  const res = await request(createApp()).post("/api/auth/login").send({ email, password: email }).expect(200);
  return res.body.data as { accessToken: string };
}

describe("editor file-key visibility", () => {
  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongo.getUri());
  }, 30_000);
  beforeEach(async () => {
    await seedDatabase();
    await ProposalModel.updateOne(
      { id: "p-001" },
      { $set: { status: "DRAFT", coverFileKey: "proposals/p-001/cover.png" } },
    );
    await ProposalModel.updateOne(
      { id: "p-002" },
      {
        $set: {
          status: "BOARD_REVIEW",
          coverFileKey: "proposals/p-002/cover.png",
          manuscripts: [
            { id: "ms-p-002-v1", version: 1, fileKey: "proposals/p-002/manuscript-v1.pdf" },
            { file: { key: "proposals/p-002/manuscript-nested.pdf" } },
            { fileKey: "proposals/p-002/manuscript-current.pdf" },
            { key: "proposals/p-002/manuscript-top-level.pdf" },
          ],
          materials: [
            { id: "mat-p-002-pages", kind: "SAMPLE_PAGES", title: "Sample pages", fileKey: "proposals/p-002/sample-pages.pdf" },
            { key: "proposals/p-002/attachment-top-level.pdf" },
            { fileKey: "proposals/p-002/attachment.pdf" },
            { file: { key: "proposals/p-002/nested-attachment.pdf" } },
            {
              versions: [
                { key: "proposals/p-002/versioned-attachment-top-level.pdf" },
                { fileKey: "proposals/p-002/versioned-attachment.pdf" },
                { file: { key: "proposals/p-002/nested-versioned-attachment.pdf" } },
              ],
            },
          ],
        },
      },
    );
    await SeriesModel.create({
      id: "s-1",
      title: "Board-inaccessible production series",
      authorId: "u-mangaka",
      coverFileKey: "series/s-1/cover.png",
    });
    await ChapterModel.create({
      id: "ch-1",
      seriesId: "s-1",
      number: 1,
      title: "Production chapter",
      pages: [{ id: "p-1", pageNumber: 1, fileKey: "chapters/ch-1/pages/p-1.png" }],
      history: [],
    });
    await MaterialModel.create({
      id: "mat-1",
      chapterId: "ch-1",
      fileKey: "materials/ch-1/reference.pdf",
      title: "Production reference",
      versions: [],
    });
    await StudioTaskModel.create({
      id: "task-1",
      chapterId: "ch-1",
      pageId: "p-1",
      seriesId: "s-1",
      currentSubmissionId: "sub-1",
      status: "SUBMITTED",
    });
    await SubmissionModel.create({
      id: "sub-1",
      taskId: "task-1",
      chapterId: "ch-1",
      pageId: "p-1",
      seriesId: "s-1",
      fileKey: "submissions/sub-1/work.png",
      status: "SUBMITTED",
    });
  }, 30_000);
  afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); }, 30_000);

  it("blocks an editor from resolving a DRAFT proposal cover key", async () => {
    const editor = await loginAs("editor@mangaflow.local");
    await request(createApp())
      .post("/api/files/display-url")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({ key: "proposals/p-001/cover.png" })
      .expect(403);
  });

  it("still allows an editor to resolve a non-DRAFT proposal cover key", async () => {
    const editor = await loginAs("editor@mangaflow.local");
    await request(createApp())
      .post("/api/files/display-url")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({ key: "proposals/p-002/cover.png" })
      .expect(200);
  });

  it("allows an editor to resolve manuscript and supporting material keys", async () => {
    const editor = await loginAs("editor@mangaflow.local");

    for (const key of [
      "proposals/p-002/manuscript-v1.pdf",
      "proposals/p-002/sample-pages.pdf",
    ]) {
      await request(createApp())
        .post("/api/files/display-url")
        .set("Authorization", `Bearer ${editor.accessToken}`)
        .send({ key })
        .expect(200);
    }
  });
  it("allows Board to resolve visible Proposal files but not a draft file", async () => {
    const board = await loginAs("board@beachread.jp");
    for (const key of [
      "proposals/p-002/cover.png",
      "proposals/p-002/manuscript-v1.pdf",
      "proposals/p-002/sample-pages.pdf",
    ]) {
      await request(createApp())
        .post("/api/files/display-url")
        .set("Authorization", `Bearer ${board.accessToken}`)
        .send({ key })
        .expect(200);
    }
    await request(createApp())
      .post("/api/files/display-url")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({ key: "proposals/p-001/cover.png", fileName: "cover.png" })
      .expect(403);
  });

  it.each([
    "proposals/p-002/manuscript-top-level.pdf",
    "proposals/p-002/manuscript-v1.pdf",
    "proposals/p-002/manuscript-current.pdf",
    "proposals/p-002/attachment-top-level.pdf",
    "proposals/p-002/attachment.pdf",
    "proposals/p-002/nested-attachment.pdf",
    "proposals/p-002/versioned-attachment-top-level.pdf",
    "proposals/p-002/versioned-attachment.pdf",
    "proposals/p-002/nested-versioned-attachment.pdf",
  ])("allows Board display URL for a Board-review proposal file %s", async (key) => {
    const board = await loginAs("board@beachread.jp");
    await request(createApp())
      .post("/api/files/display-url")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({ key })
      .expect(200);
  });

  it.each([
    "chapters/ch-1/pages/p-1.png",
    "series/s-1/cover.png",
    "materials/ch-1/reference.pdf",
    "submissions/sub-1/work.png",
  ])("blocks Board display URL for production key %s", async (key) => {
    const board = await loginAs("board@beachread.jp");
    await request(createApp())
      .post("/api/files/display-url")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({ key })
      .expect(403);
  });
});
