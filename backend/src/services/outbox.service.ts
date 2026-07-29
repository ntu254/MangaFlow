import { OutboxEventModel } from "../db/models.js";

export type OutboxDeliveryHandler = (event: any) => Promise<void>;

export type ProcessOutboxOptions = {
  batchSize?: number;
  maxAttempts?: number;
  now?: Date;
};

function retryDelayMs(attempts: number) {
  const seconds = Math.min(60 * 30, 2 ** Math.max(attempts - 1, 0) * 30);
  return seconds * 1000;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export async function processOutboxBatch(
  handler: OutboxDeliveryHandler,
  options: ProcessOutboxOptions = {},
) {
  const now = options.now ?? new Date();
  const batchSize = options.batchSize ?? 25;
  const maxAttempts = options.maxAttempts ?? 5;
  const dueEvents = await OutboxEventModel.find({
    status: { $in: ["PENDING", "FAILED"] },
    $or: [{ nextAttemptAt: { $exists: false } }, { nextAttemptAt: { $lte: now } }],
  })
    .sort({ createdAt: 1 })
    .limit(batchSize)
    .lean();

  const results = { sent: 0, failed: 0, deadLettered: 0, skipped: 0 };

  for (const event of dueEvents as any[]) {
    const claimed = await OutboxEventModel.findOneAndUpdate(
      {
        id: event.id,
        status: { $in: ["PENDING", "FAILED"] },
      },
      { $set: { status: "PROCESSING", updatedAt: new Date() } },
      { returnDocument: "after" },
    ).lean();
    if (!claimed) {
      results.skipped += 1;
      continue;
    }

    try {
      await handler(claimed);
      await OutboxEventModel.updateOne(
        { id: event.id },
        {
          $set: {
            status: "SENT",
            processedAt: new Date(),
            updatedAt: new Date(),
          },
        },
      );
      results.sent += 1;
    } catch (error) {
      const attempts = Number((claimed as any).attempts ?? 0) + 1;
      const deadLetter = attempts >= maxAttempts;
      await OutboxEventModel.updateOne(
        { id: event.id },
        {
          $set: {
            status: deadLetter ? "DEAD_LETTER" : "FAILED",
            attempts,
            lastError: errorMessage(error).slice(0, 1000),
            nextAttemptAt: deadLetter ? null : new Date(Date.now() + retryDelayMs(attempts)),
            updatedAt: new Date(),
          },
        },
      );
      if (deadLetter) results.deadLettered += 1;
      else results.failed += 1;
    }
  }

  return results;
}
