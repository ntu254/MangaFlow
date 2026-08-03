import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { createApp } from "../app.js";
import { seedDatabase } from "../seed.js";
import { ProposalModel } from "../db/models.js";

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
          status: "PENDING_BOARD",
          coverFileKey: "proposals/p-002/cover.png",
          manuscripts: [{ id: "ms-p-002-v1", version: 1, fileKey: "proposals/p-002/manuscript-v1.pdf" }],
          materials: [{ id: "mat-p-002-pages", kind: "SAMPLE_PAGES", title: "Sample pages", fileKey: "proposals/p-002/sample-pages.pdf" }],
        },
      },
    );
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
  it("allows a Board user to resolve a visible review file but not a draft file", async () => {
    const board = await loginAs("board@beachread.jp");
    await request(createApp())
      .post("/api/files/display-url")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({ key: "proposals/p-002/cover.png", fileName: "cover.png" })
      .expect(200);
    await request(createApp())
      .post("/api/files/display-url")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .send({ key: "proposals/p-001/cover.png", fileName: "cover.png" })
      .expect(403);
  });
});
