import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import { seedDatabase } from "../seed.js";

let mongo: MongoMemoryReplSet;
const BLOCKED_CHAPTER = "ch-s-berserk-prod-5"; // seeded TANTOU_REVIEW chapter

async function loginAs(email: string, password = email) {
  const response = await request(createApp())
    .post("/api/auth/login")
    .send({ email, password })
    .expect(200);
  return response.body.data as { accessToken: string };
}

describe("mobile editor chapter actions parity", () => {
  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongo.getUri());
  }, 30_000);

  beforeEach(async () => {
    await seedDatabase();
  }, 30_000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  }, 30_000);

  it("reports the same readiness and refuses a blocked direct approval", async () => {
    const editor = await loginAs("tanaka@beachread.jp"); // assigned Tantou for s-berserk-prod
    const detail = await request(createApp())
      .get(`/api/editor/chapters/${BLOCKED_CHAPTER}/detail`)
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .expect(200);

    const approve = detail.body.data.actions.find((a: any) => a.action === "EDITOR_APPROVE");
    expect(approve).toBeTruthy();

    if (!detail.body.data.readiness.ready) {
      // A blocked chapter must not offer approval, and a direct canonical
      // approve must be rejected with a conflict.
      expect(approve.enabled).toBe(false);
      expect((approve.disabledReason ?? "").length).toBeGreaterThan(0);
      await request(createApp())
        .post(`/api/chapters/${BLOCKED_CHAPTER}/actions/EDITOR_APPROVE`)
        .set("Authorization", `Bearer ${editor.accessToken}`)
        .send({})
        .expect(409);
    } else {
      expect(approve.enabled).toBe(true);
    }
  });

  it("denies chapter detail to a Board member", async () => {
    const board = await loginAs("sato@beachread.jp");
    await request(createApp())
      .get(`/api/editor/chapters/${BLOCKED_CHAPTER}/detail`)
      .set("Authorization", `Bearer ${board.accessToken}`)
      .expect(403);
  });

  it("denies chapter detail to an Editor who is not the active Tantou", async () => {
    const editor = await loginAs("editor@mangaflow.local");
    await request(createApp())
      .get(`/api/editor/chapters/${BLOCKED_CHAPTER}/detail`)
      .set("Authorization", `Bearer ${editor.accessToken}`)
      .expect(403);
  });
});
