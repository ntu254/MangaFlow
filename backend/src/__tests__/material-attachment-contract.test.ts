import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import { seedDatabase } from "../seed.js";

let mongo: MongoMemoryServer;

async function loginAs(email: string) {
  const response = await request(createApp())
    .post("/api/auth/login")
    .send({ email, password: email })
    .expect(200);
  return response.body.data as { accessToken: string };
}

describe("Supporting Material attachment contract", () => {
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

  it("creates an attachment without lifecycle status and rejects status patches", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const created = await request(createApp())
      .post("/api/materials")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({
        seriesId: "s-berserk-prod",
        title: "Character reference",
        kind: "character",
        fileKey: "materials/character-reference.png",
      })
      .expect(201);

    expect(created.body.data.status).toBeUndefined();

    const rejected = await request(createApp())
      .patch(`/api/materials/${created.body.data.id}`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ status: "ACTIVE" })
      .expect(400);

    expect(rejected.body.code).toBe("VALIDATION_ERROR");
  });

  it("allows only the owning Mangaka to mutate Supporting Materials", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const editor = await loginAs("tanaka@beachread.jp");
    const created = await request(createApp())
      .post("/api/materials")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ seriesId: "s-berserk-prod", title: "Owner reference" })
      .expect(201);

    await request(createApp())
      .patch(`/api/materials/${created.body.data.id}`)
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({ title: "Editor rewrite" })
      .expect(403);

    await request(createApp())
      .post("/api/materials")
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .send({ seriesId: "s-berserk-prod", title: "Editor attachment" })
      .expect(403);
  });

  it("rejects embedded Manuscript and Supporting Material lifecycle statuses", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");

    for (const payload of [
      { manuscripts: [{ id: "mv-legacy", version: 1, status: "SUBMITTED" }] },
      { materials: [{ id: "mat-legacy", title: "Reference", status: "ACTIVE" }] },
    ]) {
      const response = await request(createApp())
        .post("/api/proposals")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .send({ title: "Status-free attachment contract", ...payload })
        .expect(400);
      expect(response.body.code).toBe("VALIDATION_ERROR");
    }
  });
});
