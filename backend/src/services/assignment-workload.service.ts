import {
  ChapterModel,
  SubmissionModel,
  StudioCommentModel,
  StudioTaskModel,
} from "../db/models.js";

export type WorkloadBlocker = {
  kind: "TASK" | "CHAPTER" | "COMMENT" | "SUBMISSION";
  id: string;
  status: string;
};

const TERMINAL_ASSISTANT_TASK_STATUSES = new Set([
  "MANGAKA_APPROVED",
  "REJECTED",
  "CANCELLED",
]);

export async function findAssistantAssignmentBlockers(
  seriesId: string,
  assistantId: string,
): Promise<WorkloadBlocker[]> {
  const tasks = await StudioTaskModel.find({
    seriesId,
    assigneeId: assistantId,
    $or: [
      { assignmentStatus: { $in: ["ACCEPTED"] } },
      { assignmentStatus: { $exists: false } },
    ],
  })
    .select({ id: 1, status: 1, assignmentStatus: 1 })
    .lean();

  return tasks
    .filter(
      (task: any) => !TERMINAL_ASSISTANT_TASK_STATUSES.has(String(task.status)),
    )
    .map((task: any) => ({
      kind: "TASK" as const,
      id: String(task.id),
      status: String(task.status),
    }))
    .sort(compareBlockers);
}

export async function findTantouWorkloadBlockers(
  seriesId: string,
  session?: any,
): Promise<WorkloadBlocker[]> {
  const applySession = (query: any) =>
    session ? query.session(session) : query;

  // Production records are not guaranteed to carry a denormalized seriesId.
  // Resolve the full production graph first so removal cannot bypass a blocker
  // that is linked through a chapter, page, region, task, or target reference.
  const chapters = await applySession(
    ChapterModel.find({ seriesId }).select({ id: 1, pages: 1 }).lean(),
  );
  const chapterIds = chapters.map((chapter: any) => String(chapter.id));
  const pageIds = chapters.flatMap((chapter: any) =>
    ((chapter.pages ?? []) as any[]).map((page) => page?.id).filter(Boolean),
  );
  const tasks = await applySession(
    StudioTaskModel.find({ $or: [{ seriesId }, { chapterId: { $in: chapterIds } }] })
      .select({ id: 1 })
      .lean(),
  );
  const taskIds = tasks.map((task: any) => String(task.id));
  const [reviewChapters, comments, submissions] = await Promise.all([
    applySession(
      ChapterModel.find({
        seriesId,
        status: { $in: ["TANTOU_REVIEW", "REVISION_REQUIRED"] },
      }),
    )
      .select({ id: 1, status: 1 })
      .lean(),
    applySession(
      StudioCommentModel.find({
        $and: [
          {
            $or: [
              { seriesId },
              { chapterId: { $in: chapterIds } },
              { pageId: { $in: pageIds } },
              { taskId: { $in: taskIds } },
              { targetType: "CHAPTER", targetId: { $in: chapterIds } },
              { targetType: "PAGE", targetId: { $in: pageIds } },
              { targetType: "TASK", targetId: { $in: taskIds } },
            ],
          },
          { $or: [{ isBlocking: true }, { blocking: true }] },
        ],
        status: { $in: ["OPEN", "REOPENED"] },
      }),
    )
      .select({ id: 1, status: 1 })
      .lean(),
    applySession(
      SubmissionModel.find({
        status: { $in: ["PENDING", "MANGAKA_APPROVED", "REVISION_REQUESTED"] },
        $or: [
          { seriesId },
          { chapterId: { $in: chapterIds } },
          { taskId: { $in: taskIds } },
        ],
      }),
    )
      .select({ id: 1, status: 1 })
      .lean(),
  ]);
  return [
    ...reviewChapters.map((item: any) => ({
      kind: "CHAPTER" as const,
      id: String(item.id),
      status: String(item.status),
    })),
    ...comments.map((item: any) => ({
      kind: "COMMENT" as const,
      id: String(item.id),
      status: String(item.status),
    })),
    ...submissions.map((item: any) => ({
      kind: "SUBMISSION" as const,
      id: String(item.id),
      status: String(item.status),
    })),
  ].sort(compareBlockers);
}

function compareBlockers(left: WorkloadBlocker, right: WorkloadBlocker) {
  return left.kind.localeCompare(right.kind) || left.id.localeCompare(right.id);
}
