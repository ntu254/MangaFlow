import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import { SeriesModel } from "../db/models.js";
import { seedDatabase } from "../seed.js";

let mongo: MongoMemoryReplSet;

async function loginAsMangaka() {
  const response = await request(createApp())
    .post("/api/auth/login")
    .send({ email: "inoue@beachread.jp", password: "inoue@beachread.jp" })
    .expect(200);
  return response.body.data as { accessToken: string; user: { id: string } };
}

async function createPreProductionSeries(id: string, authorId: string, deletedAt?: Date) {
  await SeriesModel.create({
    id,
    slug: id,
    title: `Retention test ${id}`,
    authorId,
    authorName: "Inoue Takehiko",
    status: "PRE_PRODUCTION",
    ...(deletedAt ? { deletedAt } : {}),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe("Series retention lifecycle", () => {
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

  it("does not expose a destructive DELETE endpoint for a pre-production series", async () => {
    const mangaka = await loginAsMangaka();
    await createPreProductionSeries("s-retention-delete", mangaka.user.id);

    await request(createApp())
      .delete("/api/series/s-retention-delete")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .expect(404);

    const retained = await SeriesModel.findOne({ id: "s-retention-delete" }).lean();
    expect(retained).toMatchObject({ status: "PRE_PRODUCTION" });
    expect(retained).not.toHaveProperty("deletedAt");
  });

  it("hides legacy soft-deleted series instead of returning a mutable-looking record", async () => {
    const mangaka = await loginAsMangaka();
    await createPreProductionSeries("s-retention-legacy", mangaka.user.id, new Date());

    const list = await request(createApp())
      .get("/api/series?mine=true")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .expect(200);
    expect(list.body.data.map((series: { id: string }) => series.id)).not.toContain("s-retention-legacy");

    await request(createApp())
      .get("/api/series/s-retention-legacy")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .expect(404);

    await request(createApp())
      .patch("/api/series/s-retention-legacy")
      .set("Authorization", `Bearer ${mangaka.accessToken}`)
      .send({ title: "Must remain inaccessible" })
      .expect(404);
  });
});
