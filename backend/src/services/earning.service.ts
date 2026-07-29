import { EarningModel } from "../db/models.js";
import { id } from "../domain/ids.js";
import type { ClientSession } from "mongoose";
import { createOutboxEvent } from "./workflow-support.service.js";

function computeEstimatedAmount(task: any) {
  const quantity = Number(task.quantity ?? 1);
  const rate = Number(task.rateSnapshot ?? 0);
  return quantity * rate;
}

export async function recordTaskEarning(task: any, submission: any, session: ClientSession) {
  if (!submission.assistantId) return;
  const amount = computeEstimatedAmount(task);
  const sourceKey = `TASK_APPROVAL:${task.id}:${submission.id}`;
  await EarningModel.findOneAndUpdate(
    { taskId: task.id },
    {
      $setOnInsert: {
        id: id("earn"),
        sourceKey,
        assistantId: submission.assistantId,
        period: String(new Date().toISOString().slice(0, 7)),
        taskId: task.id,
        submissionId: submission.id,
        seriesId: task.seriesId,
        chapterId: task.chapterId,
        subtotal: amount,
        amount,
        currency: task.currency ?? "VND",
        status: "EARNED",
        createdAt: new Date(),
      },
      $set: { updatedAt: new Date() },
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
      assistantId: submission.assistantId,
    },
    session,
  );
}

export { computeEstimatedAmount };
