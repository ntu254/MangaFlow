import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import { EarningLedgerEntryModel, StudioTaskModel } from "../db/models.js";
import { seedDatabase } from "../seed.js";
import {
  appendEarningEntry,
  reverseEarningEntry,
  summarizeEarningLedger,
} from "../services/earning-ledger.service.js";

let mongo: MongoMemoryReplSet;

async function loginAs(email: string, password = email) {
  const response = await request(createApp())
    .post("/api/auth/login")
    .send({ email, password })
    .expect(200);
  return response.body.data as { accessToken: string; user: { id: string; role: string } };
}

describe("EARN-001 — earning ledger with immutable entries", () => {
  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongo.getUri());
  }, 30_000);

  beforeEach(async () => {
    await seedDatabase();
    await EarningLedgerEntryModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it("appends EARN entries with idempotent sourceKey", async () => {
    const sourceKey = "TASK_APPROVAL:task-1:sub-1";

    const first = await appendEarningEntry({
      entryType: "EARN",
      assistantId: "u-assist",
      taskId: "task-1",
      submissionId: "sub-1",
      sourceKey,
      amount: 25,
      currency: "USD",
    });
    expect(first.created).toBe(true);

    const second = await appendEarningEntry({
      entryType: "EARN",
      assistantId: "u-assist",
      taskId: "task-1",
      submissionId: "sub-1",
      sourceKey,
      amount: 25,
      currency: "USD",
    });
    expect(second.created).toBe(false);
    expect(second.entry.id).toBe(first.entry.id);

    const total = await EarningLedgerEntryModel.countDocuments({ sourceKey });
    expect(total).toBe(1);
  });

  it("reverses an EARN entry with a TASK_REVERSAL:<taskId>:<submissionId> key", async () => {
    const sourceKey = "TASK_APPROVAL:task-2:sub-2";
    await appendEarningEntry({
      entryType: "EARN",
      assistantId: "u-assist",
      taskId: "task-2",
      submissionId: "sub-2",
      sourceKey,
      amount: 40,
      currency: "USD",
    });

    const reverse = await reverseEarningEntry(sourceKey, "u-editor", "Quality mismatch");
    expect(reverse.created).toBe(true);
    expect(reverse.entry.amount).toBe(-40);
    expect(reverse.entry.reverseOfKey).toBe(sourceKey);

    const summary = await summarizeEarningLedger("u-assist");
    expect(summary.totalEarned).toBe(40);
    expect(summary.totalReversed).toBe(40);
    expect(summary.netConfirmed).toBe(-40);
  });

  it("replay-the-tape summary tolerates CONFIRM and PAY alongside EARN", async () => {
    await appendEarningEntry({
      entryType: "EARN",
      assistantId: "u-assist",
      taskId: "t-3",
      submissionId: "s-3",
      sourceKey: "TASK_APPROVAL:t-3:s-3",
      amount: 30,
    });
    await appendEarningEntry({
      entryType: "CONFIRM",
      assistantId: "u-assist",
      taskId: "t-3",
      submissionId: "s-3",
      sourceKey: "TASK_CONFIRM:t-3:s-3",
      amount: 30,
      actorId: "u-editor",
    });
    await appendEarningEntry({
      entryType: "PAY",
      assistantId: "u-assist",
      taskId: "t-3",
      submissionId: "s-3",
      sourceKey: "TASK_PAY:t-3:s-3",
      amount: 30,
      actorId: "u-finance",
    });

    const summary = await summarizeEarningLedger("u-assist");
    expect(summary.totalEarned).toBe(30);
    expect(summary.totalPaid).toBe(30);
    expect(summary.netConfirmed).toBe(30);
    expect(summary.netPending).toBe(0);
  });

  it("rejects duplicates of an EARN that has already been reversed", async () => {
    const sourceKey = "TASK_APPROVAL:task-4:sub-4";
    await appendEarningEntry({
      entryType: "EARN",
      assistantId: "u-assist",
      taskId: "task-4",
      submissionId: "sub-4",
      sourceKey,
      amount: 100,
    });
    await reverseEarningEntry(sourceKey, "u-editor", "Spec changed");

    // Re-issuing the same EARN must remain a no-op, even after reversal.
    const replay = await appendEarningEntry({
      entryType: "EARN",
      assistantId: "u-assist",
      taskId: "task-4",
      submissionId: "sub-4",
      sourceKey,
      amount: 100,
    });
    expect(replay.created).toBe(false);

    const summary = await summarizeEarningLedger("u-assist");
    expect(summary.totalEarned).toBe(100);
    expect(summary.totalReversed).toBe(100);
    expect(summary.netConfirmed).toBe(-100);
  });

  it("reversing a non-existent entry returns 404 EARNING_ENTRY_NOT_FOUND", async () => {
    await expect(
      reverseEarningEntry("TASK_APPROVAL:missing-t:missing-s", "u-editor", "Audit"),
    ).rejects.toMatchObject({ status: 404, code: "EARNING_ENTRY_NOT_FOUND" });
  });
});