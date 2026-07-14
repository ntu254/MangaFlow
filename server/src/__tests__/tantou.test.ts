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
  return response.body.data as {
    accessToken: string;
    refreshToken: string;
    user: { id: string; role: string };
  };
}

describe("Tantou Editor Assignment", () => {
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

  describe("Tantou assignment routes - MVP guard", () => {
    it("does not expose the legacy reader route; Series summary carries Tantou data", async () => {
      const mangaka = await loginAs("inoue@mangaflow.local");
      await request(createApp())
        .get("/api/series/s-berserk-prod/editor")
        .set("Authorization", `Bearer ${mangaka.accessToken}`)
        .expect(404);
    });

    it("does not expose manual assignment; Board finalization is the only Tantou selection path", async () => {
      const board = await loginAs("board@mangaflow.local");
      await request(createApp())
        .post("/api/series/s-berserk-prod/editor")
        .set("Authorization", `Bearer ${board.accessToken}`)
        .send({ editorId: "u-editor", editorName: "Tanaka Akira" })
        .expect(404);
    });

    it("does not expose manual removal; lifecycle changes stay inside Board workflow commands", async () => {
      const board = await loginAs("board@mangaflow.local");
      await request(createApp())
        .delete("/api/series/s-berserk-prod/editor")
        .set("Authorization", `Bearer ${board.accessToken}`)
        .expect(404);
    });
  });
});
