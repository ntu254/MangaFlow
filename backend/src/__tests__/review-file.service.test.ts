import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { ProposalModel } from "../db/models.js";
import { seedDatabase } from "../seed.js";

let mongo: MongoMemoryReplSet;

async function loginAs(email: string) {
  const response = await request(createApp())
    .post("/api/auth/login")
    .send({ email, password: email })
    .expect(200);
  return response.body.data as { accessToken: string };
}

describe("review file metadata", () => {
  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongo.getUri());
  }, 30_000);

  beforeEach(async () => {
    await seedDatabase();
    await ProposalModel.updateOne(
      { id: "p-002" },
      {
        $set: {
          status: "PENDING_BOARD",
          manuscripts: [
            {
              id: "p-002-manuscript-current",
              version: 2,
              fileKey: "proposals/p-002/manuscript-v2.pdf",
              fileName: "neon-tide-v2.pdf",
              mimeType: "application/pdf",
              size: 256000,
              uploadedAt: new Date("2026-08-01T00:00:00.000Z"),
              uploadedByName: "Inoue Takehiko",
            },
          ],
          materials: [
            {
              id: "p-002-attachment-current",
              fileKey: "proposals/p-002/character-sheet.png",
              fileName: "character-sheet.png",
              mimeType: "image/png",
              size: 128000,
            },
            { id: "p-002-empty-attachment", fileName: "missing-key.pdf" },
          ],
        },
      },
    );
  }, 30_000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  }, 30_000);

  it("returns only Board-visible proposal files", async () => {
    const board = await loginAs("board@beachread.jp");
    const response = await request(createApp())
      .get("/api/review-files/proposal/p-002")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .expect(200);

    expect(response.body.data).toEqual([
      expect.objectContaining({
        id: "p-002-manuscript-current",
        key: "proposals/p-002/manuscript-v2.pdf",
        name: "neon-tide-v2.pdf",
        mimeType: "application/pdf",
        size: 256000,
        previewKind: "pdf",
      }),
      expect.objectContaining({
        id: "p-002-attachment-current",
        key: "proposals/p-002/character-sheet.png",
        previewKind: "image",
      }),
    ]);
  });

  it("rejects Board access to chapter review files", async () => {
    const board = await loginAs("board@beachread.jp");
    await request(createApp())
      .get("/api/review-files/chapter/ch-s-berserk-prod-5")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .expect(403);
  });
});
