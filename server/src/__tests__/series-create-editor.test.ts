import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import { seedDatabase } from "../seed.js";

let mongo: MongoMemoryServer;

async function loginAs(email: string, password = email) {
  const response = await request(createApp())
    .post("/api/auth/login")
    .send({ email, password })
    .expect(200);
  return response.body.data as { accessToken: string };
}

describe("POST /api/series workflow lock", () => {
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  });

  beforeEach(async () => {
    await seedDatabase();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it("returns 403 for Mangaka manual Series creation", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    await request(createApp())
      .post("/api/series")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ title: "No-editor series" })
      .expect(403);
  });

  it("returns 403 for Editor manual Series creation even with Tantou fields", async () => {
    const editor = await loginAs("tanaka@beachread.jp");
    await request(createApp())
      .post("/api/series")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({ title: "Editor series", editorId: "u-editor", editorName: "Spoofed Name" })
      .expect(403);
  });

  it("checks workflow lock before Tantou validation", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    await request(createApp())
      .post("/api/series")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ title: "Bad editor series", editorId: "u-mangaka" })
      .expect(403);
  });

  it("checks workflow lock before unknown editor validation", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    await request(createApp())
      .post("/api/series")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ title: "Missing editor series", editorId: "u-does-not-exist" })
      .expect(403);
  });
});
