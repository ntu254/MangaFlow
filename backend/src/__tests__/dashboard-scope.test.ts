import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { seedDatabase } from "../seed.js";

let mongo: MongoMemoryReplSet;

async function loginAs(email: string) {
  const res = await request(createApp()).post("/api/auth/login").send({ email, password: email }).expect(200);
  return res.body.data as { accessToken: string };
}

describe("dashboard summary scoping", () => {
  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongo.getUri());
  }, 30_000);
  beforeEach(async () => { await seedDatabase(); }, 30_000);
  afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); }, 30_000);

  it("blocks a board user from requesting the editor dashboard", async () => {
    const board = await loginAs("board@beachread.jp");
    await request(createApp())
      .get("/api/dashboard/editor/summary")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .expect(403);
  });

  it("allows a board user to request their own dashboard", async () => {
    const board = await loginAs("board@beachread.jp");
    await request(createApp())
      .get("/api/dashboard/board/summary")
      .set("Authorization", `Bearer ${board.accessToken}`)
      .expect(200);
  });
});
