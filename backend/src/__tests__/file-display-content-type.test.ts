import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { seedDatabase } from "../seed.js";
import { ProposalModel } from "../db/models.js";
import { putLocalObject } from "../services/file-access.service.js";

let mongo: MongoMemoryReplSet;

async function loginAs(email: string) {
  const res = await request(createApp())
    .post("/api/auth/login")
    .send({ email, password: email })
    .expect(200);
  return res.body.data as { accessToken: string };
}

describe("submitted-file display content type", () => {
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
          status: "BOARD_REVIEW",
          manuscripts: [
            { id: "ms-content-type", version: 1, fileKey: "proposals/p-002/content-type-check.pdf" },
          ],
        },
      },
    );
    await putLocalObject(
      "proposals/p-002/content-type-check.pdf",
      Buffer.from("%PDF-1.4 fixture bytes"),
    );
  }, 30_000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  }, 30_000);

  it("serves a submitted PDF as application/pdf, not application/octet-stream", async () => {
    const editor = await loginAs("editor@mangaflow.local");

    const displayUrlResponse = await request(createApp())
      .post("/api/files/display-url")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({ key: "proposals/p-002/content-type-check.pdf", fileName: "content-type-check.pdf" })
      .expect(200);

    const displayPath = new URL(displayUrlResponse.body.data.url).pathname;

    const fileResponse = await request(createApp())
      .get(displayPath)
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .expect(200);

    expect(fileResponse.headers["content-type"]).toMatch(/^application\/pdf/);
  });

  it("allows the Android WebView API origin to fetch the signed PDF", async () => {
    const editor = await loginAs("editor@mangaflow.local");
    const webViewBaseUrl = "http://10.0.2.2:3001";

    const displayUrlResponse = await request(createApp())
      .post("/api/files/display-url")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({ key: "proposals/p-002/content-type-check.pdf", fileName: "content-type-check.pdf" })
      .expect(200);

    const displayPath = new URL(displayUrlResponse.body.data.url).pathname;
    const fileResponse = await request(createApp())
      .get(displayPath)
      .set("Origin", webViewBaseUrl)
      .expect(200);

    expect(fileResponse.headers["access-control-allow-origin"]).toBe(webViewBaseUrl);
    expect(fileResponse.headers["cross-origin-resource-policy"]).toBe("cross-origin");
  });
});
