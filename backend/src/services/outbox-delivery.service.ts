import {
  ChapterModel,
  NotificationModel,
  ProposalModel,
  SeriesModel,
  StudioTaskModel,
  SubmissionModel,
} from "../db/models.js";
import type { OutboxDeliveryHandler } from "./outbox.service.js";

type OutboxEvent = {
  id: string;
  type: string;
  aggregateType: string;
  aggregateId: string;
  payload?: Record<string, unknown>;
};

async function seriesForTask(task: any) {
  if (task?.seriesId) return (await SeriesModel.findOne({ id: task.seriesId }).lean()) as any;
  if (!task?.chapterId) return null;
  const chapter = (await ChapterModel.findOne({ id: task.chapterId }).lean()) as any;
  return chapter?.seriesId
    ? ((await SeriesModel.findOne({ id: chapter.seriesId }).lean()) as any)
    : null;
}

async function notifyOnce(event: OutboxEvent, userId: string, title: string, message: string) {
  const notificationId = `outbox-${event.id}-${userId}`;
  await NotificationModel.updateOne(
    { id: notificationId },
    {
      $setOnInsert: {
        id: notificationId,
        userId,
        kind: event.type,
        title,
        message,
        createdAt: new Date(),
      },
    },
    { upsert: true },
  );
}

async function deliverTaskEvent(event: OutboxEvent) {
  const task = (await StudioTaskModel.findOne({ id: event.aggregateId }).lean()) as any;
  const series = await seriesForTask(task);
  if (!series?.authorId) return;
  const verb = event.type === "task.reopened" ? "reopened for revision" : "received new work";
  await notifyOnce(
    event,
    String(series.authorId),
    event.type,
    `Task ${event.aggregateId} ${verb}.`,
  );
}

async function deliverSubmissionEvent(event: OutboxEvent) {
  const submission = (await SubmissionModel.findOne({ id: event.aggregateId }).lean()) as any;
  const task = submission?.taskId
    ? await StudioTaskModel.findOne({ id: submission.taskId }).lean()
    : null;
  const series = await seriesForTask(task);
  if (!series?.authorId) return;
  await notifyOnce(
    event,
    String(series.authorId),
    event.type,
    `Submission ${event.aggregateId} changed to ${String(event.payload?.status ?? "updated")}.`,
  );
}

async function deliverBoardEvent(event: OutboxEvent) {
  const proposalIds = Array.isArray(event.payload?.proposalIds)
    ? event.payload.proposalIds.map(String)
    : [];
  const proposals = await ProposalModel.find({ id: { $in: proposalIds } }).lean();
  await Promise.all(
    proposals
      .filter((proposal: any) => proposal.authorId)
      .map((proposal: any) =>
        notifyOnce(
          event,
          String(proposal.authorId),
          "Board decision finalized",
          `Proposal ${proposal.id} was finalized with result ${String(event.payload?.result ?? "UNKNOWN")}.`,
        ),
      ),
  );
}

export const deliverOutboxEvent: OutboxDeliveryHandler = async (rawEvent) => {
  const event = rawEvent as OutboxEvent;
  if (event.type === "task.submitted" || event.type === "task.reopened") {
    await deliverTaskEvent(event);
    return;
  }
  if (event.type.startsWith("submission.")) {
    await deliverSubmissionEvent(event);
    return;
  }
  if (event.type === "board.session.finalized") {
    await deliverBoardEvent(event);
    return;
  }
  if (event.type === "earning.earned") {
    const assistantId = String(event.payload?.assistantId ?? "");
    if (assistantId) {
      await notifyOnce(
        event,
        assistantId,
        "Earning recorded",
        `Earning for ${String(event.payload?.taskId ?? event.aggregateId)} was recorded.`,
      );
    }
    return;
  }
  throw new Error(`Unsupported outbox event type: ${event.type}`);
};
