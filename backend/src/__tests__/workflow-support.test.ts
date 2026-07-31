import mongoose from "mongoose";
import { afterEach, describe, expect, it, vi } from "vitest";
import { runWorkflowTransaction } from "../services/workflow-support.service.js";

describe("runWorkflowTransaction", () => {
  afterEach(() => vi.restoreAllMocks());

  it("maps wrapped standalone Mongo transaction errors to 503", async () => {
    const error = Object.assign(
      new Error("This MongoDB deployment does not support retryable writes."),
      { originalError: new Error("Transaction numbers are only allowed on a replica set member or mongos") },
    );
    vi.spyOn(mongoose, "startSession").mockResolvedValue({
      withTransaction: async (fn: () => unknown) => fn(),
      endSession: async () => undefined,
    } as any);

    await expect(runWorkflowTransaction(async () => { throw error; }))
      .rejects.toMatchObject({ status: 503, code: "MONGODB_REPLICA_SET_REQUIRED" });
  });
});
