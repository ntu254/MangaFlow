import {
  ChapterModel,
  MaterialModel,
  ProposalModel,
  SeriesMemberModel,
  SeriesModel,
  StudioCommentModel,
  StudioRegionModel,
  StudioTaskModel,
  SubmissionModel,
} from "../db/models.js";
import { AppError } from "../lib/http.js";
import type { RequestActor } from "../types.js";

const BOARD_VISIBLE_PROPOSAL_STATUSES = new Set([
  "PENDING_BOARD",
  "READY_FOR_BOARD",
  "BOARD_REVIEW",
  "BOARD_VOTING",
  "TIE_BREAK",
  "APPROVED",
  "REJECTED",
]);

function forbidden(message = "You do not have permission for this record.") {
  return new AppError(403, message, "FORBIDDEN");
}

export function mergeScope(
  filter: Record<string, unknown>,
  scope: Record<string, unknown>,
): Record<string, unknown> {
  if (Object.keys(scope).length === 0) return filter;
  if (Object.keys(filter).length === 0) return scope;
  return { $and: [filter, scope] };
}

export function canReadProposal(actor: RequestActor, proposal: any) {
  if (actor.role === "MANGAKA") return proposal.authorId === actor.id;
  if (actor.role === "EDITOR") return String(proposal.status) !== "DRAFT";
  if (actor.role === "BOARD") {
    return BOARD_VISIBLE_PROPOSAL_STATUSES.has(String(proposal.status));
  }
  return false;
}

export function canMutateProposalAsEditor(actor: RequestActor, proposal: any) {
  if (actor.role !== "EDITOR") return false;
  if (actor.isEditorInChief) return true;
  const assigned = proposal.assignedEditorId ?? proposal.claimedByEditorId;
  return !assigned || assigned === actor.id;
}

export async function assertCanReadProposal(actor: RequestActor, proposal: any) {
  if (!canReadProposal(actor, proposal)) throw forbidden("You do not have permission for this proposal.");
}

export async function assertCanReadProposalById(actor: RequestActor, proposalId: string) {
  const proposal = await ProposalModel.findOne({ id: proposalId }).lean();
  if (!proposal) throw new AppError(404, "Proposal not found.", "PROPOSAL_NOT_FOUND");
  await assertCanReadProposal(actor, proposal);
  return proposal;
}

async function hasActiveSeriesMembership(actor: RequestActor, series: any) {
  if (Array.isArray(series.assistantIds) && series.assistantIds.includes(actor.id)) return true;
  const member = await SeriesMemberModel.findOne({
    seriesId: series.id,
    userId: actor.id,
    status: "active",
  }).lean();
  return Boolean(member);
}

export async function canReadSeries(actor: RequestActor, series: any) {
  if (actor.role === "BOARD") return true;
  if (actor.role === "MANGAKA") return series.authorId === actor.id;
  if (actor.role === "EDITOR") return series.editorId === actor.id;
  if (actor.role === "ASSISTANT") return hasActiveSeriesMembership(actor, series);
  return false;
}

export async function canMutateSeries(actor: RequestActor, series: any) {
  if (actor.role === "MANGAKA") return series.authorId === actor.id;
  if (actor.role === "EDITOR") return series.editorId === actor.id;
  return false;
}

export async function assertCanReadSeries(actor: RequestActor, series: any) {
  if (!(await canReadSeries(actor, series))) throw forbidden("You do not have permission for this series.");
}

export async function assertCanMutateSeries(actor: RequestActor, series: any) {
  if (!(await canMutateSeries(actor, series))) throw forbidden("You do not have permission to change this series.");
}

export async function assertCanReadSeriesById(actor: RequestActor, seriesId: string) {
  const series = await SeriesModel.findOne({ id: seriesId }).lean();
  if (!series) throw new AppError(404, "Series not found.", "SERIES_NOT_FOUND");
  await assertCanReadSeries(actor, series);
  return series;
}

export async function assertCanMutateSeriesById(actor: RequestActor, seriesId: string) {
  const series = await SeriesModel.findOne({ id: seriesId }).lean();
  if (!series) throw new AppError(404, "Series not found.", "SERIES_NOT_FOUND");
  await assertCanMutateSeries(actor, series);
  return series;
}

export async function assertAssignedSeriesEditor(actor: RequestActor, series: any) {
  if (actor.role === "EDITOR" && series.editorId === actor.id) return;
  throw new AppError(
    403,
    "Only the assigned Tantou can perform this action.",
    "TANTOU_ASSIGNMENT_REQUIRED",
  );
}

export async function assertCanReadChapter(actor: RequestActor, chapter: any) {
  const series = await SeriesModel.findOne({ id: chapter.seriesId }).lean();
  if (!series) throw new AppError(404, "Series not found.", "SERIES_NOT_FOUND");
  await assertCanReadSeries(actor, series);
  return series;
}

export async function assertCanMutateChapter(actor: RequestActor, chapter: any) {
  const series = await SeriesModel.findOne({ id: chapter.seriesId }).lean();
  if (!series) throw new AppError(404, "Series not found.", "SERIES_NOT_FOUND");
  await assertCanMutateSeries(actor, series);
  return series;
}

export async function assertCanMutateChapterContent(actor: RequestActor, chapter: any) {
  const series = await SeriesModel.findOne({ id: chapter.seriesId }).lean();
  if (!series) throw new AppError(404, "Series not found.", "SERIES_NOT_FOUND");
  if (actor.role === "MANGAKA" && (series as any).authorId === actor.id) return series;
  throw new AppError(
    403,
    "Only the owning Mangaka can change chapter or page content.",
    actor.role === "MANGAKA" ? "MANGAKA_OWNER_REQUIRED" : "FORBIDDEN",
  );
}

export async function assertCanReadChapterById(actor: RequestActor, chapterId: string) {
  const chapter = await ChapterModel.findOne({ id: chapterId }).lean();
  if (!chapter) throw new AppError(404, "Chapter not found.", "CHAPTER_NOT_FOUND");
  await assertCanReadChapter(actor, chapter);
  return chapter;
}

export async function assertCanMutateChapterById(actor: RequestActor, chapterId: string) {
  const chapter = await ChapterModel.findOne({ id: chapterId }).lean();
  if (!chapter) throw new AppError(404, "Chapter not found.", "CHAPTER_NOT_FOUND");
  await assertCanMutateChapter(actor, chapter);
  return chapter;
}

export async function actorSeriesScopeFilter(actor: RequestActor, mode: "read" | "mutate" = "read") {
  if (mode === "read" && actor.role === "BOARD") return {};
  if (actor.role === "MANGAKA") return { authorId: actor.id };
  if (actor.role === "EDITOR") return { editorId: actor.id };
  if (actor.role === "ASSISTANT" && mode === "read") {
    const memberships = await SeriesMemberModel.find({ userId: actor.id, status: "active" }).lean();
    const seriesIds = memberships.map((item: any) => item.seriesId);
    return { $or: [{ id: { $in: seriesIds } }, { assistantIds: actor.id }] };
  }
  return { id: { $in: [] } };
}

export async function productionScopeFilter(actor: RequestActor, mode: "read" | "mutate" = "read") {
  if (actor.role === "BOARD") return { id: { $in: [] } };
  if (actor.role === "ASSISTANT") {
    const tasks = await StudioTaskModel.find({ assigneeId: actor.id })
      .select({ id: 1, regionId: 1 })
      .lean();
    const taskIds = tasks.map((item: any) => item.id);
    const regionIds = tasks.map((item: any) => item.regionId).filter(Boolean);
    if (mode === "mutate") return { assigneeId: actor.id };
    return {
      $or: [
        { assigneeId: actor.id },
        { assistantId: actor.id },
        { id: { $in: [...taskIds, ...regionIds] } },
        { taskId: { $in: taskIds } },
        { activeTaskId: { $in: taskIds } },
        { lockedByTaskId: { $in: taskIds } },
      ],
    };
  }
  const seriesScope = await actorSeriesScopeFilter(actor, mode);
  const series = await SeriesModel.find(seriesScope).select({ id: 1 }).lean();
  const seriesIds = series.map((item: any) => item.id);
  const chapters = await ChapterModel.find({ seriesId: { $in: seriesIds } }).select({ id: 1 }).lean();
  const chapterIds = chapters.map((item: any) => item.id);
  return { $or: [{ seriesId: { $in: seriesIds } }, { chapterId: { $in: chapterIds } }] };
}

function visibleProposalFilter(actor: RequestActor, mode: "read" | "mutate" = "read") {
  if (actor.role === "MANGAKA") return { authorId: actor.id };
  if (actor.role === "EDITOR") {
    if (mode === "mutate") {
      if (actor.isEditorInChief) return { status: { $ne: "DRAFT" } };
      return {
        status: { $ne: "DRAFT" },
        $or: [
          { assignedEditorId: actor.id },
          { claimedByEditorId: actor.id },
          { assignedEditorId: { $exists: false }, claimedByEditorId: { $exists: false } },
          { assignedEditorId: null, claimedByEditorId: null },
        ],
      };
    }
    return { status: { $ne: "DRAFT" } };
  }
  if (actor.role === "BOARD" && mode === "read") {
    return { status: { $in: [...BOARD_VISIBLE_PROPOSAL_STATUSES] } };
  }
  return { id: { $in: [] } };
}

async function scopedProductionIds(actor: RequestActor, mode: "read" | "mutate" = "read") {
  if (actor.role === "BOARD") {
    return { seriesIds: [], chapterIds: [], pageIds: [], taskIds: [], regionIds: [] };
  }

  if (actor.role === "ASSISTANT") {
    if (mode === "mutate") {
      return { seriesIds: [], chapterIds: [], pageIds: [], taskIds: [], regionIds: [] };
    }
    const [memberships, memberSeries, assignedTasks] = await Promise.all([
      SeriesMemberModel.find({ userId: actor.id, status: "active" }).select({ seriesId: 1 }).lean(),
      SeriesModel.find({ assistantIds: actor.id }).select({ id: 1 }).lean(),
      StudioTaskModel.find({ assigneeId: actor.id, status: { $ne: "CANCELLED" } })
        .select({ id: 1, seriesId: 1, chapterId: 1, pageId: 1, regionId: 1 })
        .lean(),
    ]);
    const seriesIds = [
      ...new Set([
        ...memberships.map((item: any) => item.seriesId),
        ...memberSeries.map((item: any) => item.id),
        ...assignedTasks.map((item: any) => item.seriesId).filter(Boolean),
      ]),
    ];
    const chapterIdsFromTasks = assignedTasks.map((item: any) => item.chapterId).filter(Boolean);
    const chapters = await ChapterModel.find({
      $or: [{ seriesId: { $in: seriesIds } }, { id: { $in: chapterIdsFromTasks } }],
    })
      .select({ id: 1, pages: 1 })
      .lean();
    return {
      seriesIds,
      chapterIds: [...new Set([...chapters.map((item: any) => item.id), ...chapterIdsFromTasks])],
      pageIds: [
        ...new Set([
          ...chapters.flatMap((chapter: any) => ((chapter.pages ?? []) as any[]).map((page) => page.id)).filter(Boolean),
          ...assignedTasks.map((item: any) => item.pageId).filter(Boolean),
        ]),
      ],
      taskIds: assignedTasks.map((item: any) => item.id),
      regionIds: assignedTasks.map((item: any) => item.regionId).filter(Boolean),
    };
  }

  const seriesScope = await actorSeriesScopeFilter(actor, mode);
  const series = await SeriesModel.find(seriesScope).select({ id: 1 }).lean();
  const seriesIds = series.map((item: any) => item.id);
  const chapters = await ChapterModel.find({ seriesId: { $in: seriesIds } })
    .select({ id: 1, pages: 1 })
    .lean();
  const chapterIds = chapters.map((item: any) => item.id);
  const [tasks, regions] = await Promise.all([
    StudioTaskModel.find({ $or: [{ seriesId: { $in: seriesIds } }, { chapterId: { $in: chapterIds } }] })
      .select({ id: 1 })
      .lean(),
    StudioRegionModel.find({ $or: [{ seriesId: { $in: seriesIds } }, { chapterId: { $in: chapterIds } }] })
      .select({ id: 1 })
      .lean(),
  ]);
  return {
    seriesIds,
    chapterIds,
    pageIds: chapters.flatMap((chapter: any) => ((chapter.pages ?? []) as any[]).map((page) => page.id)).filter(Boolean),
    taskIds: tasks.map((item: any) => item.id),
    regionIds: regions.map((item: any) => item.id),
  };
}

export async function materialScopeFilter(actor: RequestActor, mode: "read" | "mutate" = "read") {
  const proposalIds = (await ProposalModel.find(visibleProposalFilter(actor, mode)).select({ id: 1 }).lean()).map(
    (item: any) => item.id,
  );
  const { seriesIds, chapterIds, pageIds } = await scopedProductionIds(actor, mode);
  return {
    $or: [
      { proposalId: { $in: proposalIds } },
      { seriesId: { $in: seriesIds } },
      { chapterId: { $in: chapterIds } },
      { pageId: { $in: pageIds } },
    ],
  };
}

export async function commentScopeFilter(actor: RequestActor) {
  const { seriesIds, chapterIds, pageIds, taskIds, regionIds } = await scopedProductionIds(actor, "read");
  const submissions = await SubmissionModel.find({
    $or: [
      { assistantId: actor.id },
      { seriesId: { $in: seriesIds } },
      { chapterId: { $in: chapterIds } },
      { taskId: { $in: taskIds } },
    ],
  })
    .select({ id: 1 })
    .lean();
  const submissionIds = submissions.map((item: any) => item.id);
  return {
    $or: [
      { authorId: actor.id },
      { seriesId: { $in: seriesIds } },
      { chapterId: { $in: chapterIds } },
      { pageId: { $in: pageIds } },
      { regionId: { $in: regionIds } },
      { taskId: { $in: taskIds } },
      { targetType: "CHAPTER", targetId: { $in: chapterIds } },
      { targetType: "PAGE", targetId: { $in: pageIds } },
      { targetType: "REGION", targetId: { $in: regionIds } },
      { targetType: "TASK", targetId: { $in: taskIds } },
      { targetType: "SUBMISSION", targetId: { $in: submissionIds } },
    ],
  };
}

export async function assertCanReadMaterial(actor: RequestActor, material: any) {
  if (material.proposalId) {
    await assertCanReadProposalById(actor, String(material.proposalId));
    return;
  }
  if (material.pageId) {
    const chapter = await ChapterModel.findOne({ "pages.id": String(material.pageId) }).lean();
    if (!chapter) throw new AppError(404, "Page not found.", "PAGE_NOT_FOUND");
    await assertCanReadChapter(actor, chapter);
    return;
  }
  if (material.chapterId) {
    await assertCanReadChapterById(actor, String(material.chapterId));
    return;
  }
  if (material.seriesId) {
    await assertCanReadSeriesById(actor, String(material.seriesId));
    return;
  }
  throw forbidden("You do not have permission for this material.");
}

export async function assertCanMutateMaterial(actor: RequestActor, material: any) {
  if (material.proposalId) {
    const proposal = await ProposalModel.findOne({ id: String(material.proposalId) }).lean();
    if (!proposal) throw new AppError(404, "Proposal not found.", "PROPOSAL_NOT_FOUND");
    if (actor.role === "MANGAKA" && (proposal as any).authorId === actor.id) return;
    if (canMutateProposalAsEditor(actor, proposal)) return;
    throw forbidden("You do not have permission to change this material.");
  }
  if (material.pageId) {
    await assertCanMutateStudioPage(actor, String(material.pageId));
    return;
  }
  if (material.chapterId) {
    await assertCanMutateChapterById(actor, String(material.chapterId));
    return;
  }
  if (material.seriesId) {
    await assertCanMutateSeriesById(actor, String(material.seriesId));
    return;
  }
  throw forbidden("You do not have permission to change this material.");
}

export async function assertCanReadMaterialById(actor: RequestActor, materialId: string) {
  const material = await MaterialModel.findOne({ id: materialId }).lean();
  if (!material) throw new AppError(404, "Material not found.", "MATERIAL_NOT_FOUND");
  await assertCanReadMaterial(actor, material);
  return material;
}

export async function assertCanMutateMaterialById(actor: RequestActor, materialId: string) {
  const material = await MaterialModel.findOne({ id: materialId }).lean();
  if (!material) throw new AppError(404, "Material not found.", "MATERIAL_NOT_FOUND");
  await assertCanMutateMaterial(actor, material);
  return material;
}

type MaterialWorkflowActors = { ownerId?: string; assignedEditorId?: string };

async function materialWorkflowActors(material: any): Promise<MaterialWorkflowActors> {
  if (material.proposalId) {
    const proposal = (await ProposalModel.findOne({ id: String(material.proposalId) }).lean()) as any;
    if (!proposal) throw new AppError(404, "Proposal not found.", "PROPOSAL_NOT_FOUND");
    return {
      ownerId: proposal.authorId,
      assignedEditorId: proposal.assignedEditorId ?? proposal.claimedByEditorId ?? undefined,
    };
  }

  const series = material.seriesId
    ? ((await SeriesModel.findOne({ id: String(material.seriesId) }).lean()) as any)
    : material.chapterId
      ? await ChapterModel.findOne({ id: String(material.chapterId) })
          .lean()
          .then((chapter: any) =>
            chapter ? SeriesModel.findOne({ id: String(chapter.seriesId) }).lean() : null,
          )
      : material.pageId
        ? await ChapterModel.findOne({ "pages.id": String(material.pageId) })
            .lean()
            .then((chapter: any) =>
              chapter ? SeriesModel.findOne({ id: String(chapter.seriesId) }).lean() : null,
            )
        : null;
  if (!series) throw new AppError(404, "Series not found.", "SERIES_NOT_FOUND");
  return { ownerId: series.authorId, assignedEditorId: series.editorId };
}

/** APPROVED is a workflow decision; only the assigned Tantou may make it. */
export async function assertCanTransitionMaterialToApproved(actor: RequestActor, material: any) {
  const { assignedEditorId } = await materialWorkflowActors(material);
  if (actor.role === "EDITOR" && assignedEditorId === actor.id) return;
  throw new AppError(
    403,
    "Only the assigned Tantou can approve a material.",
    "TANTOU_ASSIGNMENT_REQUIRED",
  );
}

/** ACTIVE and ARCHIVED are owner/assigned-Tantou material lifecycle actions. */
export async function assertCanTransitionMaterialAsOwnerOrTantou(
  actor: RequestActor,
  material: any,
) {
  const { ownerId, assignedEditorId } = await materialWorkflowActors(material);
  if (
    (actor.role === "MANGAKA" && ownerId === actor.id) ||
    (actor.role === "EDITOR" && assignedEditorId === actor.id)
  ) {
    return;
  }
  const code = actor.role === "MANGAKA" ? "MANGAKA_OWNER_REQUIRED" : "TANTOU_ASSIGNMENT_REQUIRED";
  throw new AppError(403, "Only the owner or assigned Tantou can change this material status.", code);
}

export async function assertCanMutateMaterialTarget(actor: RequestActor, input: any) {
  if (input.proposalId) {
    await assertCanMutateMaterial(actor, { proposalId: input.proposalId });
    return;
  }
  if (input.pageId) {
    await assertCanMutateStudioPage(actor, String(input.pageId));
    return;
  }
  if (input.chapterId) {
    await assertCanMutateChapterById(actor, String(input.chapterId));
    return;
  }
  if (input.seriesId) {
    await assertCanMutateSeriesById(actor, String(input.seriesId));
    return;
  }
  throw new AppError(400, "A visible proposal, series, chapter, or page target is required.", "VALIDATION_ERROR");
}

export async function assertCanReadTask(actor: RequestActor, task: any) {
  if (actor.role === "ASSISTANT") {
    if (task.assigneeId === actor.id) return;
    throw forbidden("Task is not assigned to the current assistant.");
  }
  const series = task.seriesId
    ? await SeriesModel.findOne({ id: task.seriesId }).lean()
    : task.chapterId
      ? await ChapterModel.findOne({ id: task.chapterId }).lean().then((chapter: any) =>
          chapter ? SeriesModel.findOne({ id: chapter.seriesId }).lean() : null,
        )
      : null;
  if (series && (await canReadSeries(actor, series))) return;
  throw forbidden("You do not have permission for this task.");
}

export async function assertCanMutateTask(actor: RequestActor, task: any) {
  const series = task.seriesId
    ? await SeriesModel.findOne({ id: task.seriesId }).lean()
    : task.chapterId
      ? await ChapterModel.findOne({ id: task.chapterId }).lean().then((chapter: any) =>
          chapter ? SeriesModel.findOne({ id: chapter.seriesId }).lean() : null,
        )
      : null;
  if (series && (await canMutateSeries(actor, series))) return;
  const code =
    actor.role === "MANGAKA"
      ? "MANGAKA_OWNER_REQUIRED"
      : actor.role === "EDITOR"
        ? "TANTOU_ASSIGNMENT_REQUIRED"
        : "FORBIDDEN";
  throw new AppError(403, "You do not have permission to change this task.", code);
}

export async function assertCanReadRegion(actor: RequestActor, region: any) {
  if (region.chapterId) {
    await assertCanReadChapterById(actor, String(region.chapterId));
    return;
  }
  if (region.seriesId) {
    await assertCanReadSeriesById(actor, String(region.seriesId));
    return;
  }
  throw forbidden("You do not have permission for this region.");
}

export async function assertCanMutateRegion(actor: RequestActor, region: any) {
  if (region.chapterId) {
    await assertCanMutateChapterById(actor, String(region.chapterId));
    return;
  }
  if (region.seriesId) {
    await assertCanMutateSeriesById(actor, String(region.seriesId));
    return;
  }
  throw forbidden("You do not have permission to change this region.");
}

export async function assertCanMutateStudioPage(actor: RequestActor, pageId: string) {
  const chapter = await ChapterModel.findOne({ "pages.id": pageId }).lean();
  if (!chapter) throw new AppError(404, "Page not found.", "PAGE_NOT_FOUND");
  await assertCanMutateChapter(actor, chapter);
  return chapter;
}

export async function assertCanMutatePageContent(actor: RequestActor, pageId: string) {
  const chapter = await ChapterModel.findOne({ "pages.id": pageId }).lean();
  if (!chapter) throw new AppError(404, "Page not found.", "PAGE_NOT_FOUND");
  await assertCanMutateChapterContent(actor, chapter);
  return chapter;
}

export async function assertCanReadCommentTarget(actor: RequestActor, input: any) {
  if (input.taskId || input.targetType === "TASK") {
    const task = await StudioTaskModel.findOne({ id: String(input.taskId ?? input.targetId) }).lean();
    if (!task) throw new AppError(404, "Task not found.", "TASK_NOT_FOUND");
    await assertCanReadTask(actor, task);
    return;
  }
  if (input.regionId || input.targetType === "REGION") {
    const region = await StudioRegionModel.findOne({ id: String(input.regionId ?? input.targetId) }).lean();
    if (!region) throw new AppError(404, "Region not found.", "REGION_NOT_FOUND");
    await assertCanReadRegion(actor, region);
    return;
  }
  if (input.pageId || input.targetType === "PAGE") {
    const chapter = await ChapterModel.findOne({ "pages.id": String(input.pageId ?? input.targetId) }).lean();
    if (!chapter) throw new AppError(404, "Page not found.", "PAGE_NOT_FOUND");
    await assertCanReadChapter(actor, chapter);
    return;
  }
  if (input.chapterId || input.targetType === "CHAPTER") {
    await assertCanReadChapterById(actor, String(input.chapterId ?? input.targetId));
    return;
  }
  if (input.seriesId) {
    await assertCanReadSeriesById(actor, String(input.seriesId));
    return;
  }
  if (input.targetType === "SUBMISSION") {
    const submission = await SubmissionModel.findOne({ id: String(input.targetId) }).lean();
    if (!submission) throw new AppError(404, "Submission not found.", "SUBMISSION_NOT_FOUND");
    if (actor.role === "ASSISTANT" && (submission as any).assistantId === actor.id) return;
    if ((submission as any).taskId) {
      const task = await StudioTaskModel.findOne({ id: String((submission as any).taskId) }).lean();
      if (task) {
        await assertCanReadTask(actor, task);
        return;
      }
    }
  }
  throw forbidden("A visible comment target is required.");
}

export async function assertCanReadSubmission(actor: RequestActor, submission: any) {
  if (actor.role === "ASSISTANT" && submission.assistantId === actor.id) return;
  if (submission.taskId) {
    const task = await StudioTaskModel.findOne({ id: String(submission.taskId) }).lean();
    if (task) {
      await assertCanReadTask(actor, task);
      return;
    }
  }
  if (submission.chapterId) {
    await assertCanReadChapterById(actor, String(submission.chapterId));
    return;
  }
  if (submission.seriesId) {
    await assertCanReadSeriesById(actor, String(submission.seriesId));
    return;
  }
  throw forbidden("You do not have permission for this submission.");
}

export async function assertCanReadComment(actor: RequestActor, comment: any) {
  if (comment.authorId === actor.id) return;
  await assertCanReadCommentTarget(actor, comment);
}

export async function assertCanReadCommentById(actor: RequestActor, commentId: string) {
  const comment = await StudioCommentModel.findOne({ id: commentId }).lean();
  if (!comment) throw new AppError(404, "Comment not found.", "COMMENT_NOT_FOUND");
  await assertCanReadComment(actor, comment);
  return comment;
}
