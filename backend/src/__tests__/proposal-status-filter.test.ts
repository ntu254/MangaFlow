import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import { seedDatabase } from "../seed.js";

let mongo: MongoMemoryReplSet;

describe("proposal status filters", () => {
  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongo.getUri());
    await seedDatabase();
  }, 30_000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  }, 30_000);

  it("accepts BOARD_REVIEW because it is the canonical status of an open VotingSession", async () => {
    const login = await request(createApp())
      .post("/api/auth/login")
      .send({ email: "board@beachread.jp", password: "board@beachread.jp" })
      .expect(200);

    const response = await request(createApp())
      .get("/api/proposals")
      .query({ status: "PENDING_BOARD,BOARD_REVIEW,APPROVED,REJECTED" })
      .set("Authorization", `Bearer ${login.body.data.accessToken}`)
      .expect(200);

    expect(Array.isArray(response.body.data)).toBe(true);
  });
});
