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

describe("POST /api/series — Tantou editor assignment", () => {
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

  it("does NOT auto-assign a seed editor when none is provided", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const res = await request(createApp())
      .post("/api/series")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ title: "No-editor series" })
      .expect(201);

    // The old code hardcoded "u-editor" / "Tanaka Akira"; it must be gone.
    expect(res.body.data.editorId ?? "").not.toBe("u-editor");
    expect(res.body.data.editorName ?? "").not.toBe("Tanaka Akira");
    expect(res.body.data.editorId ?? "").toBe("");
  });

  it("accepts an explicit active EDITOR as the Tantou", async () => {
    const editor = await loginAs("tanaka@beachread.jp");
    const res = await request(createApp())
      .post("/api/series")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({ title: "Editor series", editorId: "u-editor", editorName: "Spoofed Name" })
      .expect(201);

    expect(res.body.data.editorId).toBe("u-editor");
    // Name is taken from the account record, not the client-supplied value.
    expect(res.body.data.editorName).toBe("Tanaka Akira");
  });

  it("rejects a non-editor account as the Tantou (400)", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    await request(createApp())
      .post("/api/series")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ title: "Bad editor series", editorId: "u-mangaka" })
      .expect(400);
  });

  it("rejects an unknown/inactive editor id (404)", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    await request(createApp())
      .post("/api/series")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ title: "Missing editor series", editorId: "u-does-not-exist" })
      .expect(404);
  });
});
