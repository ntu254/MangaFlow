import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { SeriesModel } from "../db/models.js";
import { seedDatabase } from "../seed.js";

let mongo: MongoMemoryReplSet;

describe("DB-STATUS-001 — Series.status enum guard", () => {
  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongo.getUri());
  }, 30_000);

  beforeEach(async () => {
    await seedDatabase();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it("rejects writes that put AT_RISK into Series.status", async () => {
    const series = await SeriesModel.findOne({}).lean();
    expect(series).toBeTruthy();
    await expect(
      SeriesModel.updateOne(
        { id: (series as any).id },
        { $set: { status: "AT_RISK" } },
        { runValidators: true },
      ),
    ).rejects.toThrow(/AT_RISK|is not a valid enum value/);
  });

  it("accepts canonical lifecycle statuses", async () => {
    const series = await SeriesModel.findOne({}).lean();
    for (const status of ["PLANNING", "ONGOING", "PAUSED", "ARCHIVED", "PRE_PRODUCTION"]) {
      await SeriesModel.updateOne({ id: (series as any).id }, { $set: { status } });
      const after = await SeriesModel.findOne({ id: (series as any).id }).lean();
      expect((after as any).status).toBe(status);
    }
  });

  it("rejects arbitrary strings", async () => {
    const series = await SeriesModel.findOne({}).lean();
    await expect(
      SeriesModel.updateOne(
        { id: (series as any).id },
        { $set: { status: "WHATEVER" } },
        { runValidators: true },
      ),
    ).rejects.toThrow();
  });
});