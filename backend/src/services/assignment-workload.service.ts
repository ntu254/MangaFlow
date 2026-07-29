import {
  ChapterModel,
  MaterialModel,
  StudioCommentModel,
  StudioTaskModel,
  SubmissionModel,
} from "../db/models.js";

export type WorkloadBlocker = {
  kind: "TASK" | "CHAPTER" | "COMMENT" | "MATERIAL" | "SUBMISSION";
  id: string;
  status: string;
};

const TERMINAL_ASSISTANT_TASK_STATUSES = new Set([
  "MANGAKA_APPROVED",
  "EDITOR_APPROVED",
  "REJECTED",
  "CANCELLED",
  "COMPLETED",
]);

export async function findAssistantAssignmentBlockers(
  seriesId: string,
  assistantId: string,
): Promise<WorkloadBlocker[]> {
  const tasks = await StudioTaskModel.find({ seriesId, assigneeId: assistantId })
    .select({ id: 1, status: 1 })
    .lean();

  return tasks
    .filter((task: any) => !TERMINAL_ASSISTANT_TASK_STATUSES.has(String(task.status)))
    .map((task: any) => ({ kind: "TASK" as const, id: String(task.id), status: String(task.status) }))
    .sort(compareBlockers);
}

export async function findTantouWorkloadBlockers(seriesId: string): Promise<WorkloadBlocker[]> {
  const [chapters, comments, materials, submissions] = await Promise.all([
    ChapterModel.find({ seriesId, status: { $in: ["TANTOU_REVIEW", "REVISION_REQUIRED"] } })
      .select({ id: 1, status: 1 })
      .lean(),
    StudioCommentModel.find({
      seriesId,
      isBlocking: true,
      status: { $in: ["OPEN", "REOPENED"] },
    })
      .select({ id: 1, status: 1 })
      .lean(),
    MaterialModel.find({ seriesId, status: "IN_REVIEW" })
      .select({ id: 1, status: 1 })
      .lean(),
    SubmissionModel.find({
      seriesId,
      reviewStage: "EDITOR_REVIEW",
      status: "MANGAKA_APPROVED",
    })
      .select({ id: 1, status: 1 })
      .lean(),
  ]);

  return [
    ...chapters.map((item: any) => ({ kind: "CHAPTER" as const, id: String(item.id), status: String(item.status) })),
    ...comments.map((item: any) => ({ kind: "COMMENT" as const, id: String(item.id), status: String(item.status) })),
    ...materials.map((item: any) => ({ kind: "MATERIAL" as const, id: String(item.id), status: String(item.status) })),
    ...submissions.map((item: any) => ({ kind: "SUBMISSION" as const, id: String(item.id), status: String(item.status) })),
  ].sort(compareBlockers);
}

function compareBlockers(left: WorkloadBlocker, right: WorkloadBlocker) {
  return left.kind.localeCompare(right.kind) || left.id.localeCompare(right.id);
}
