import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { describe, expect, it, beforeAll, afterAll, beforeEach } from "vitest";
import { OutboxEventModel, NotificationModel } from "../db/models.js";
import { createOutboxRunner } from "../jobs/outbox-runner.js";
import { deliverOutboxEvent } from "../services/outbox-delivery.service.js";

let mongo: MongoMemoryReplSet;

describe("outbox runtime", () => {
  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongo.getUri());
  }, 30_000);

  beforeEach(async () => {
    await OutboxEventModel.deleteMany({});
    await NotificationModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it("processes a queued event through the runner boundary", async () => {
    await OutboxEventModel.create({
      id: "outbox-runner-success",
      type: "earning.earned",
      aggregateType: "earning_source",
      aggregateId: "TASK_APPROVAL:task-1:submission-1",
      payload: { assistantId: "assistant-1", taskId: "task-1" },
      status: "PENDING",
      attempts: 0,
      nextAttemptAt: new Date(Date.now() - 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const runner = createOutboxRunner(deliverOutboxEvent, { maxAttempts: 1 });
    const result = await runner.runOnce();

    expect(result.sent).toBe(1);
    expect(((await OutboxEventModel.findOne({ id: "outbox-runner-success" }).lean()) as any)?.status).toBe(
      "SENT",
    );
    expect(await NotificationModel.countDocuments({ userId: "assistant-1" })).toBe(1);
  });

  it("keeps delivery idempotent when the same event is retried", async () => {
    await OutboxEventModel.create({
      id: "outbox-runner-idempotent",
      type: "earning.earned",
      aggregateType: "earning_source",
      aggregateId: "TASK_APPROVAL:task-2:submission-2",
      payload: { assistantId: "assistant-2", taskId: "task-2" },
      status: "PENDING",
      attempts: 0,
      nextAttemptAt: new Date(Date.now() - 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const runner = createOutboxRunner(deliverOutboxEvent, { maxAttempts: 1 });
    await runner.runOnce();
    await OutboxEventModel.updateOne(
      { id: "outbox-runner-idempotent" },
      { $set: { status: "PENDING", nextAttemptAt: new Date(Date.now() - 1000) } },
    );
    await runner.runOnce();

    expect(await NotificationModel.countDocuments({ userId: "assistant-2" })).toBe(1);
  });
});
