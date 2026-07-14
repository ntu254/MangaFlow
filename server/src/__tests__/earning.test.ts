import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { EarningModel, EarningItemModel } from "../db/models.js";
import {
  resolveTaskRate,
  earningPeriodOf,
  earningIdFor,
  recomputeAssistantEarning,
} from "../modules/earnings/application/earning.service.js";

let mongo: MongoMemoryServer;

async function seedItem(assistantId: string, period: string, amount: number, extra: Record<string, unknown> = {}) {
  return EarningItemModel.create({
    id: `eitem-${Math.random().toString(36).slice(2)}`,
    earningId: earningIdFor(assistantId, period),
    assistantId,
    taskId: `task-${Math.random().toString(36).slice(2)}`,
    period,
    taskType: "lettering",
    rate: amount,
    amount,
    currency: "VND",
    status: "APPROVED",
    createdAt: new Date(),
    ...extra,
  });
}

describe("Earning rate table & monthly rollup", () => {
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  beforeEach(async () => {
    await EarningModel.deleteMany({});
    await EarningItemModel.deleteMany({});
  });

  describe("resolveTaskRate", () => {
    it("returns a configured rate for a known task type (case-insensitive)", () => {
      expect(resolveTaskRate("lettering")).toBeGreaterThan(0);
      expect(resolveTaskRate("LETTERING")).toBe(resolveTaskRate("lettering"));
    });

    it("falls back to the default rate for unknown/empty types", () => {
      expect(resolveTaskRate("something-unmapped")).toBe(resolveTaskRate("default"));
      expect(resolveTaskRate(undefined)).toBe(resolveTaskRate("default"));
      expect(resolveTaskRate("")).toBe(resolveTaskRate("default"));
    });
  });

  it("buckets a date into a YYYY-MM period", () => {
    expect(earningPeriodOf(new Date("2026-07-13T00:00:00Z"))).toBe("2026-07");
  });

  it("sums approved items into the monthly Earning aggregate", async () => {
    const period = "2026-07";
    await seedItem("u-assist", period, 25000);
    await seedItem("u-assist", period, 40000);

    const earning = (await recomputeAssistantEarning("u-assist", period)) as any;

    expect(earning.id).toBe(earningIdFor("u-assist", period));
    expect(earning.subtotal).toBe(65000);
    expect(earning.tasksCount).toBe(2);
    expect(earning.amount).toBe(65000);
    expect(earning.status).toBe("PENDING");
  });

  it("updates read-only monthly totals when approved task items change", async () => {
    const period = "2026-07";
    await seedItem("u-assist", period, 50000);
    await EarningModel.create({
      id: earningIdFor("u-assist", period),
      assistantId: "u-assist",
      period,
      subtotal: 0,
      amount: 0,
      currency: "VND",
      status: "PENDING",
      createdAt: new Date(),
    });

    const earning = (await recomputeAssistantEarning("u-assist", period)) as any;

    expect(earning.subtotal).toBe(50000);
    expect(earning.amount).toBe(50000);
  });

  it("does not expose payroll confirmation/payment lifecycle in the MVP aggregate", async () => {
    const period = "2026-07";
    await seedItem("u-assist", period, 30000);
    await EarningModel.create({
      id: earningIdFor("u-assist", period),
      assistantId: "u-assist",
      period,
      subtotal: 999,
      amount: 999,
      currency: "VND",
      status: "PENDING",
      createdAt: new Date(),
    });

    const earning = (await recomputeAssistantEarning("u-assist", period)) as any;

    expect(earning.status).toBe("PENDING");
    expect(earning.amount).toBe(30000);
  });
});
