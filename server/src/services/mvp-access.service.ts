import {
  ChapterModel,
  SeriesMemberModel,
  SeriesModel,
  StudioCommentModel,
  StudioRegionModel,
  StudioTaskModel,
} from "../db/models.js";
import { AppError } from "../lib/http.js";
import type { RequestActor } from "../types.js";

const PROPOSAL_EDITOR_STATUSES = [
  "SUBMITTED",
  "PENDING_EDITOR",
  "EDITOR_REVIEWING",
  "CHANGES_REQUESTED",
  "RESUBMITTED",
];

const PROPOSAL_BOARD_STATUSES = [
  "PENDING_BOARD",
  "BOARD_VOTING",
  "TIE_BREAK",
  "APPROVED",
  "REJECTED",
];

export function scopedProposalFilterForActor(actor: RequestActor): Record<string, unknown> {
  if (actor.role === "MANGAKA") return { authorId: actor.id };
  if (actor.role === "EDITOR") {
    return {
      $or: [
        { status: { $in: PROPOSAL_EDITOR_STATUSES } },
        { assignedEditorId: actor.id },
        { claimedByEditorId: actor.id },
      ],
    };
  }
  if (actor.role === "BOARD") return { status: { $in: PROPOSAL_BOARD_STATUSES } };
  return { id: "__mvp_no_proposal_access__" };
}

export function canReadProposal(actor: RequestActor, proposal: any) {
  if (actor.role === "MANGAKA") return proposal.authorId === actor.id;
  if (actor.role === "EDITOR") {
    return (
      PROPOSAL_EDITOR_STATUSES.includes(String(proposal.status)) ||
      proposal.assignedEditorId === actor.id ||
      proposal.claimedByEditorId === actor.id
    );
  }
  if (actor.role === "BOARD") return PROPOSAL_BOARD_STATUSES.includes(String(proposal.status));
  return false;
}

export function governanceSeriesAllowed(actor: RequestActor, series: any) {
  if (actor.role === "BOARD") return true;
  if (actor.role === "MANGAKA") return series.authorId === actor.id;
  if (actor.role === "EDITOR") return series.editorId === actor.id;
  return false;
}

export async function readableProductionSeriesIds(actor: RequestActor) {
  if (actor.role === "MANGAKA") {
    return (await SeriesModel.find({ authorId: actor.id }).select("id").lean()).map(
      (series: any) => String(series.id),
    );
  }
  if (actor.role === "EDITOR") {
    return (await SeriesModel.find({ editorId: actor.id }).select("id").lean()).map(
      (series: any) => String(series.id),
    );
  }
  if (actor.role === "ASSISTANT") {
    const [memberships, tasks] = await Promise.all([
      SeriesMemberModel.find({ userId: actor.id, status: "active" }).select("seriesId").lean(),
      StudioTaskModel.find({
        assigneeId: actor.id,
        status: { $ne: "CANCELLED" },
        seriesId: { $exists: true, $ne: "" },
      })
        .select("seriesId")
        .lean(),
    ]);
    return [
      ...new Set([
        ...memberships.map((member: any) => String(member.seriesId)),
        ...tasks.map((task: any) => String(task.seriesId)),
      ]),
    ];
  }
  return [];
}

export async function canReadProductionSeries(actor: RequestActor, series: any) {
  if (!series) return false;
  if (actor.role === "MANGAKA") return series.authorId === actor.id;
  if (actor.role === "EDITOR") return series.editorId === actor.id;
  if (actor.role === "ASSISTANT") {
    const [membership, task] = await Promise.all([
      SeriesMemberModel.findOne({
        seriesId: String(series.id),
        userId: actor.id,
        status: "active",
      }).lean(),
      StudioTaskModel.findOne({
        seriesId: String(series.id),
        assigneeId: actor.id,
        status: { $ne: "CANCELLED" },
      }).lean(),
    ]);
    return Boolean(membership || task);
  }
  return false;
}

export async function assertCanReadProductionSeries(actor: RequestActor, seriesId: string) {
  const series = await SeriesModel.findOne({ id: seriesId }).lean();
  if (!series || !(await canReadProductionSeries(actor, series))) {
    throw new AppError(404, "Series not found.", "SERIES_NOT_FOUND");
  }
  return series;
}

export async function assertCanReadGovernanceSeries(actor: RequestActor, seriesId: string) {
  const series = await SeriesModel.findOne({ id: seriesId }).lean();
  if (!series || !governanceSeriesAllowed(actor, series)) {
    throw new AppError(404, "Series not found.", "SERIES_NOT_FOUND");
  }
  return series;
}

export function scopedProductionSeriesFilter(seriesIds: string[]) {
  return seriesIds.length > 0 ? { id: { $in: seriesIds } } : { id: "__mvp_no_series_access__" };
}

export async function assertCanReadChapter(actor: RequestActor, chapterId: string) {
  const chapter = await ChapterModel.findOne({ id: chapterId }).lean();
  if (!chapter) throw new AppError(404, "Chapter not found.", "CHAPTER_NOT_FOUND");
  await assertCanReadProductionSeries(actor, String((chapter as any).seriesId));
  return chapter;
}

export async function assertCanReadPage(actor: RequestActor, pageId: string) {
  const chapter = await ChapterModel.findOne({ "pages.id": pageId }).lean();
  if (!chapter) throw new AppError(404, "Page not found.", "PAGE_NOT_FOUND");
  await assertCanReadProductionSeries(actor, String((chapter as any).seriesId));
  return chapter;
}

export async function readableChapterIds(actor: RequestActor) {
  const seriesIds = await readableProductionSeriesIds(actor);
  if (seriesIds.length === 0) return [];
  return (await ChapterModel.find({ seriesId: { $in: seriesIds } }).select("id").lean()).map(
    (chapter: any) => String(chapter.id),
  );
}

export async function scopedChapterFilterForActor(actor: RequestActor, base: Record<string, unknown>) {
  const seriesIds = await readableProductionSeriesIds(actor);
  const scope = seriesIds.length > 0 ? { seriesId: { $in: seriesIds } } : { seriesId: "__mvp_no_series_access__" };
  return Object.keys(base).length > 0 ? { $and: [base, scope] } : scope;
}

export async function scopedTaskFilterForActor(actor: RequestActor, base: Record<string, unknown>) {
  const safeBase = { ...base };
  if (actor.role === "ASSISTANT") {
    delete safeBase.assigneeId;
    delete safeBase.assistantId;
  }
  const seriesIds = await readableProductionSeriesIds(actor);
  const scope =
    actor.role === "ASSISTANT"
      ? { assigneeId: actor.id }
      : seriesIds.length > 0
        ? { seriesId: { $in: seriesIds } }
        : { seriesId: "__mvp_no_series_access__" };
  return Object.keys(safeBase).length > 0 ? { $and: [safeBase, scope] } : scope;
}

export async function scopedRegionFilterForActor(actor: RequestActor, base: Record<string, unknown>) {
  const [seriesIds, chapterIds] = await Promise.all([
    readableProductionSeriesIds(actor),
    readableChapterIds(actor),
  ]);
  const assistantTasks =
    actor.role === "ASSISTANT"
      ? await StudioTaskModel.find({ assigneeId: actor.id, status: { $ne: "CANCELLED" } })
          .select("id pageId regionId")
          .lean()
      : [];
  const scope = {
    $or: [
      ...(seriesIds.length > 0 ? [{ seriesId: { $in: seriesIds } }] : []),
      ...(chapterIds.length > 0 ? [{ chapterId: { $in: chapterIds } }] : []),
      ...(assistantTasks.length > 0
        ? [
            { activeTaskId: { $in: assistantTasks.map((task: any) => String(task.id)) } },
            {
              id: {
                $in: assistantTasks
                  .map((task: any) => task.regionId)
                  .filter(Boolean)
                  .map(String),
              },
            },
            {
              pageId: {
                $in: assistantTasks
                  .map((task: any) => task.pageId)
                  .filter(Boolean)
                  .map(String),
              },
            },
          ]
        : []),
    ],
  };
  const safeScope = scope.$or.length > 0 ? scope : { id: "__mvp_no_region_access__" };
  return Object.keys(base).length > 0 ? { $and: [base, safeScope] } : safeScope;
}

export async function scopedCommentFilterForActor(actor: RequestActor, base: Record<string, unknown>) {
  const seriesIds = await readableProductionSeriesIds(actor);
  const [chapterIds, tasks] = await Promise.all([
    readableChapterIds(actor),
    StudioTaskModel.find(
      actor.role === "ASSISTANT"
        ? { assigneeId: actor.id, status: { $ne: "CANCELLED" } }
        : { seriesId: { $in: seriesIds } },
    )
      .select("id")
      .lean(),
  ]);
  const taskIds = tasks.map((task: any) => String(task.id));
  const scope = {
    $or: [
      ...(seriesIds.length > 0 ? [{ seriesId: { $in: seriesIds } }] : []),
      ...(chapterIds.length > 0 ? [{ chapterId: { $in: chapterIds } }] : []),
      ...(taskIds.length > 0 ? [{ taskId: { $in: taskIds } }] : []),
      { authorId: actor.id },
    ],
  };
  return Object.keys(base).length > 0 ? { $and: [base, scope] } : scope;
}

export async function assertCanReadTask(actor: RequestActor, taskId: string) {
  const task = await StudioTaskModel.findOne({ id: taskId }).lean();
  if (!task) throw new AppError(404, "Task not found.", "TASK_NOT_FOUND");
  if (actor.role === "ASSISTANT") {
    if ((task as any).assigneeId === actor.id) return task;
    throw new AppError(404, "Task not found.", "TASK_NOT_FOUND");
  }
  if ((task as any).seriesId) {
    await assertCanReadProductionSeries(actor, String((task as any).seriesId));
    return task;
  }
  if ((task as any).chapterId) {
    await assertCanReadChapter(actor, String((task as any).chapterId));
    return task;
  }
  throw new AppError(404, "Task not found.", "TASK_NOT_FOUND");
}

export async function assertCanReadRegion(actor: RequestActor, regionId: string) {
  const region = await StudioRegionModel.findOne({ id: regionId }).lean();
  if (!region) throw new AppError(404, "Region not found.", "REGION_NOT_FOUND");
  if ((region as any).seriesId) {
    await assertCanReadProductionSeries(actor, String((region as any).seriesId));
    return region;
  }
  if ((region as any).chapterId) {
    await assertCanReadChapter(actor, String((region as any).chapterId));
    return region;
  }
  throw new AppError(404, "Region not found.", "REGION_NOT_FOUND");
}

export async function assertCanReadComment(actor: RequestActor, commentId: string) {
  const comment = await StudioCommentModel.findOne({ id: commentId }).lean();
  if (!comment) throw new AppError(404, "Comment not found.", "COMMENT_NOT_FOUND");
  if ((comment as any).authorId === actor.id) return comment;
  if ((comment as any).taskId) {
    await assertCanReadTask(actor, String((comment as any).taskId));
    return comment;
  }
  if ((comment as any).seriesId) {
    await assertCanReadProductionSeries(actor, String((comment as any).seriesId));
    return comment;
  }
  if ((comment as any).chapterId) {
    await assertCanReadChapter(actor, String((comment as any).chapterId));
    return comment;
  }
  throw new AppError(404, "Comment not found.", "COMMENT_NOT_FOUND");
}
