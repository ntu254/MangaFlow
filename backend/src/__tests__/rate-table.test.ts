import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import { AuditEntryModel, RateTableModel, StudioTaskModel } from "../db/models.js";
import { seedDatabase } from "../seed.js";

let mongo: MongoMemoryServer;

async function loginAs(email: string, password = email) {
  const response = await request(createApp())
    .post("/api/auth/login")
    .send({ email, password })
    .expect(200);
  return response.body.data as { accessToken: string; user: { id: string; role: string } };
}

describe("Rate table and task price snapshot contract", () => {
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

  it("keeps rate-table writes Admin-only and records an audit entry", async () => {
    const admin = await loginAs("admin@beachread.jp");
    const mangaka = await loginAs("inoue@beachread.jp");

    await request(createApp())
      .post("/api/admin/rates")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ code: "TEST_PAGE", label: "Test page", workUnitType: "PAGE", amount: 10 })
      .expect(403);

    const response = await request(createApp())
      .post("/api/admin/rates")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({ code: "TEST_PAGE", label: "Test page", workUnitType: "PAGE", amount: 10, currency: "USD" })
      .expect(201);

    expect(response.body.data).toMatchObject({ code: "TEST_PAGE", amount: 10, currency: "USD", version: 1 });
    expect(await AuditEntryModel.exists({ action: "rate_table.create", entityId: response.body.data.id })).toBeTruthy();
  });

  it("rejects overlapping active windows for the same rate code", async () => {
    const admin = await loginAs("admin@beachread.jp");
    const body = { code: "OVERLAP", label: "Overlap test", workUnitType: "PAGE", amount: 10 };

    await request(createApp())
      .post("/api/admin/rates")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send(body)
      .expect(201);

    const response = await request(createApp())
      .post("/api/admin/rates")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({ ...body, amount: 12 })
      .expect(409);

    expect(response.body.code).toBe("RATE_WINDOW_OVERLAP");
  });

  it("resolves the active rate server-side and snapshots it on task creation", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const response = await request(createApp())
      .post("/api/studio/tasks")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({
        chapterId: "ch-s-berserk-prod-5",
        pageId: "ch-s-berserk-prod-5-p1",
        assigneeId: "u-assist",
        title: "Server-priced task",
        rateCode: "speech_bubble",
        quantity: 2,
        currency: "JPY",
      })
      .expect(201);

    expect(response.body.data).toMatchObject({
      rateCode: "SPEECH_BUBBLE",
      rateVersion: 1,
      rateSnapshot: 25,
      estimatedAmount: 50,
      currency: "USD",
      workUnitType: "PAGE",
    });
  });

  it("rejects missing rates and client-controlled monetary fields", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const app = createApp();
    const base = {
      chapterId: "ch-s-berserk-prod-5",
      pageId: "ch-s-berserk-prod-5-p1",
      assigneeId: "u-assist",
      title: "Invalid price task",
    };

    const missing = await request(app)
      .post("/api/studio/tasks")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send(base)
      .expect(409);
    expect(missing.body.code).toBe("RATE_CONFIGURATION_REQUIRED");

    const clientControlled = await request(app)
      .post("/api/studio/tasks")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ ...base, rateCode: "SPEECH_BUBBLE", rateSnapshot: 999999, estimatedAmount: 1 })
      .expect(400);
    expect(clientControlled.body.code).toBe("VALIDATION_ERROR");
  });

  it("does not allow changing a task rate snapshot after creation", async () => {
    const mangaka = await loginAs("inoue@beachread.jp");
    const task = await request(createApp())
      .post("/api/studio/tasks")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({
        chapterId: "ch-s-berserk-prod-5",
        pageId: "ch-s-berserk-prod-5-p1",
        assigneeId: "u-assist",
        title: "Immutable rate task",
        rateCode: "SPEECH_BUBBLE",
        quantity: 1,
      })
      .expect(201);

    const response = await request(createApp())
      .patch(`/api/studio/tasks/${task.body.data.id}`)
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ rateCode: "LETTERING" })
      .expect(409);

    expect(response.body.code).toBe("RATE_SNAPSHOT_IMMUTABLE");
    const stored = await StudioTaskModel.findOne({ id: task.body.data.id }).lean();
    expect(stored).toMatchObject({ rateCode: "SPEECH_BUBBLE", rateSnapshot: 25 });
  });

  it("keeps seeded rates available for the demo user flow", async () => {
    const rates = (await RateTableModel.find({ status: "ACTIVE" }).lean()) as unknown as Array<{
      code: string;
    }>;
    expect(rates.map((rate) => rate.code)).toEqual(expect.arrayContaining(["SPEECH_BUBBLE", "LETTERING"]));
  });
});
