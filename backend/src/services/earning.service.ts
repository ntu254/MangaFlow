import { EarningItemModel, EarningModel } from "../db/models.js";
import { id } from "../domain/ids.js";
import type { ClientSession } from "mongoose";
import { createOutboxEvent } from "./workflow-support.service.js";

function computeEstimatedAmount(task: any) {
  const quantity = Number(task.quantity ?? 1);
  const rate = Number(task.rateSnapshot ?? 0);
  return quantity * rate;
}

export async function recordTaskEarning(task: any, submission: any, session: ClientSession) {
  const assistantId = String(submission.assistantId ?? task.assigneeId ?? "").trim();
  if (!assistantId) {
    throw new Error(`Cannot record earning for task ${String(task.id)} without an assistant.`);
  }
  const amount = computeEstimatedAmount(task);
  const sourceKey = `TASK_APPROVAL:${task.id}:${submission.id}`;
  // Task-scoped idempotency: if the same submission is approved twice, we
  // only record one earning. The earning.model.ts file stores the parent row
  // here; EarningItemModel is the immutable per-task row that powers Sprint
  // 2.2 ledger semantics (reverse/adjust never overwrite, they append).
  const existing = await EarningModel.findOne({ taskId: task.id })
    .session(session)
    .lean();
  if (existing) return existing;
  const earning = await EarningModel.findOneAndUpdate(
    { taskId: task.id },
    {
      $setOnInsert: {
        id: id("earn"),
        sourceKey,
        assistantId,
        period: String(new Date().toISOString().slice(0, 7)),
        taskId: task.id,
        submissionId: submission.id,
        seriesId: task.seriesId,
        chapterId: task.chapterId,
        subtotal: amount,
        amount,
        currency: task.currency ?? "VND",
        status: "EARNED",
      },
    },
    { upsert: true, returnDocument: "after", session },
  );
  await EarningItemModel.findOneAndUpdate(
    { taskId: task.id },
    {
      $setOnInsert: {
        id: id("eaitem"),
        earningId: String((earning as any)?.id ?? ""),
        assistantId,
        taskId: task.id,
        submissionId: submission.id,
        seriesId: task.seriesId,
        chapterId: task.chapterId,
        taskType: String(task.type ?? "ASSISTANT_TASK"),
        rate: Number(task.rateSnapshot ?? 0),
        amount,
        currency: task.currency ?? "VND",
        status: "APPROVED",
        approvedById: submission.approvedById ?? submission.mangakaReviewedById ?? null,
        approvedAt: new Date(),
      },
    },
    { upsert: true, returnDocument: "after", session },
  );
  await createOutboxEvent(
    "earning.earned",
    "earning_source",
    sourceKey,
    {
      taskId: task.id,
      submissionId: submission.id,
      assistantId,
    },
    session,
  );
}

/**
 * Sprint 2.2 (EARN-001): append a ledger entry that voids an existing
 * earning item. The item itself is never deleted or overwritten — instead we
 * create a follow-up row with `voidedAt` set so the audit trail captures
 * the reversal reason.
 */
export async function reverseTaskEarning(
  task: any,
  actor: { id: string; name: string; role: string },
  reason: string,
  session: ClientSession,
) {
  if (!reason?.trim()) {
    throw new Error("A reason is required to reverse an earning.");
  }
  const existing = await EarningItemModel.findOne({ taskId: task.id })
    .session(session)
    .lean();
  if (!existing) return null;
  const reversal = await EarningItemModel.create(
    [
      {
        id: id("eaitem-rev"),
        earningId: (existing as any).earningId,
        assistantId: (existing as any).assistantId,
        taskId: task.id,
        submissionId: (existing as any).submissionId,
        seriesId: (existing as any).seriesId,
        chapterId: (existing as any).chapterId,
        taskType: (existing as any).taskType,
        rate: (existing as any).rate,
        amount: -Number((existing as any).amount),
        currency: (existing as any).currency,
        status: "VOIDED",
        voidedById: actor.id,
        voidedAt: new Date(),
        voidReason: reason.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    { session },
  );
  await EarningModel.updateOne(
    { taskId: task.id },
    {
      $inc: { amount: -Number((existing as any).amount) },
      $set: { status: "ADJUSTED", updatedAt: new Date() },
    },
    { session },
  );
  await createOutboxEvent(
    "earning.reversed",
    "earning_source",
    `TASK_REVERSAL:${task.id}`,
    {
      taskId: task.id,
      assistantId: (existing as any).assistantId,
      reversalAmount: Number((existing as any).amount),
      reason: reason.trim(),
      actor: { id: actor.id, role: actor.role },
    },
    session,
  );
  return reversal[0];
}

export { computeEstimatedAmount };
