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
  UserModel,
} from "../db/models.js";
import { AppError } from "../lib/http.js";
import type { RequestActor } from "../types.js";
import { env } from "../config/env.js";

const BOARD_VISIBLE_PROPOSAL_STATUSES = new Set([
  "PENDING_BOARD",
  "BOARD_REVIEW",
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
  const member = await SeriesMemberModel.findOne({
    seriesId: series.id,
    userId: actor.id,
    status: "active",
  }).lean();
  return Boolean(member);
}

async function hasActiveTantouMembership(actor: RequestActor, series: any) {
  if (actor.role !== "EDITOR" || String(series.editorId ?? "") !== String(actor.id)) return false;
  const member = await SeriesMemberModel.findOne({
    seriesId: series.id,
    userId: actor.id,
    role: "editor",
  }).lean();
  // Existing Series rows may predate SeriesMember persistence. In that case
  // the canonical Series.editorId remains the assignment source until the
  // migration backfills the membership row. An explicit inactive membership
  // still blocks access.
  return member ? (member as any).status === "active" : true;
}

export async function canReadSeries(actor: RequestActor, series: any) {
  if (actor.role === "BOARD") return true;
  if (actor.role === "MANGAKA") return series.authorId === actor.id;
  if (actor.role === "EDITOR") return hasActiveTantouMembership(actor, series);
  if (actor.role === "ASSISTANT") return hasActiveSeriesMembership(actor, series);
  return false;
}

export async function canMutateSeries(actor: RequestActor, series: any) {
  if (actor.role === "MANGAKA") return series.authorId === actor.id;
  if (actor.role === "EDITOR") return hasActiveTantouMembership(actor, series);
  return false;
}

export async function assertCanReadSeries(actor: RequestActor, series: any) {
  if (!(await canReadSeries(actor, series))) throw forbidden("You do not have permission for this series.");
}

export async function assertCanMutateSeries(actor: RequestActor, series: any) {
  if (String(series.status) === "ARCHIVED") {
    throw new AppError(409, "Series is archived and cannot be modified.", "SERIES_ARCHIVED");
  }
  if (series.deletedAt) {
    throw new AppError(409, "Series is deleted and cannot be modified.", "SERIES_DELETED");
  }
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
  if (await hasActiveTantouMembership(actor, series)) return;
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

export function assertChapterContentUnlocked(chapter: any) {
  const status = String(chapter?.status);
  if (status === "TANTOU_REVIEW") {
    throw new AppError(
      409,
      "Chapter content is locked while Tantou review is active.",
      "CHAPTER_REVIEW_LOCKED",
    );
  }
  if (!["PLANNED", "IN_PRODUCTION", "REVISION_REQUIRED"].includes(status)) {
    throw new AppError(
      409,
      "Chapter content can only change during planning, production, or revision.",
      "CHAPTER_CONTENT_LOCKED",
    );
  }
}

/**
 * Workflow integrity invariant: a chapter can only accept pages once it is
 * actively in production. PLANNED chapters must go through `applyChapterAction`
 * with `START_DRAFT` (which is audited, versioned, and outbox-published) before
 * any page is created. This prevents editors from bootstrapping a chapter by
 * creating the first page and accidentally bypassing the START_DRAFT guard.
 *
 * Controlled by the `MF_PAGE_CREATE_GUARD` flag so legacy data and dev seed
 * flows can opt out while the migration to the new invariant is in flight.
 */
export function assertChapterAcceptsPages(chapter: any) {
  if (!env.MF_PAGE_CREATE_GUARD) return;
  const status = String(chapter?.status);
  const allowed = ["IN_PRODUCTION", "REVISION_REQUIRED"];
  if (!allowed.includes(status)) {
    throw new AppError(
      409,
      `Chapter must be ${allowed.join(" | ")} to accept pages. ` +
        `Current status: ${status || "UNKNOWN"}. ` +
        `Call START_DRAFT first.`,
      "CHAPTER_NOT_IN_PRODUCTION",
    );
  }
}

export async function assertCanMutateChapterContent(actor: RequestActor, chapter: any) {
  const series = await SeriesModel.findOne({ id: chapter.seriesId }).lean();
  if (!series) throw new AppError(404, "Series not found.", "SERIES_NOT_FOUND");
  if (!(actor.role === "MANGAKA" && (series as any).authorId === actor.id)) {
    throw new AppError(
      403,
      "Only the owning Mangaka can change chapter or page content.",
      actor.role === "MANGAKA" ? "MANGAKA_OWNER_REQUIRED" : "FORBIDDEN",
    );
  }
  assertChapterContentUnlocked(chapter);
  return series;
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
  if (actor.role === "EDITOR") {
    const [members, legacyMemberships] = await Promise.all([
      SeriesMemberModel.find({ userId: actor.id, role: "editor", status: "active" })
        .select({ seriesId: 1 })
        .lean(),
      SeriesMemberModel.find({ userId: actor.id, role: "editor" })
        .select({ seriesId: 1 })
        .lean(),
    ]);
    const memberSeriesIds = new Set(legacyMemberships.map((item: any) => String(item.seriesId)));
    const legacySeries = await SeriesModel.find({ editorId: actor.id })
      .select({ id: 1 })
      .lean();
    const seriesIds = [
      ...new Set([
        ...members.map((item: any) => String(item.seriesId)),
        ...legacySeries
          .map((item: any) => String(item.id))
          .filter((seriesId) => !memberSeriesIds.has(seriesId)),
      ]),
    ];
    return { id: { $in: seriesIds } };
  }
  if (actor.role === "ASSISTANT" && mode === "read") {
    const memberships = await SeriesMemberModel.find({ userId: actor.id, status: "active" }).lean();
    const seriesIds = memberships.map((item: any) => item.seriesId);
    return { id: { $in: seriesIds } };
  }
  return { id: { $in: [] } };
}

export async function productionScopeFilter(actor: RequestActor, mode: "read" | "mutate" = "read") {
  if (actor.role === "BOARD") return { id: { $in: [] } };
  if (actor.role === "ASSISTANT") {
    const tasks = await StudioTaskModel.find({ assigneeId: actor.id })
      .select({ id: 1 })
      .lean();
    const taskIds = tasks.map((item: any) => item.id);
    if (mode === "mutate") return { assigneeId: actor.id };
    return {
      $or: [
        { assigneeId: actor.id },
        { assistantId: actor.id },
        { id: { $in: taskIds } },
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
        .select({ id: 1, seriesId: 1, chapterId: 1, pageId: 1 })
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
      regionIds: [],
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

export async function activeTantouEditorId(series: any) {
  const activeMember = await SeriesMemberModel.findOne({
    seriesId: series.id,
    role: "editor",
    status: "active",
  })
    .select({ userId: 1, status: 1 })
    .lean();
  if (activeMember) {
    const user = await UserModel.findOne({ id: String((activeMember as any).userId) })
      .select({ role: 1, active: 1 })
      .lean();
    if (user && (user as any).role === "EDITOR" && (user as any).active !== false) {
      return String((activeMember as any).userId);
    }
    return undefined;
  }
  const historicalMember = await SeriesMemberModel.findOne({
    seriesId: series.id,
    role: "editor",
  })
    .select({ status: 1 })
    .lean();
  if (historicalMember) return undefined;
  return series.editorId ? String(series.editorId) : undefined;
}

export async function materialScopeFilter(actor: RequestActor, mode: "read" | "mutate" = "read") {
  const proposalIds = (await ProposalModel.find(visibleProposalFilter(actor, mode) as any).select({ id: 1 }).lean()).map(
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
    if (actor.role === "MANGAKA" && (proposal as any).authorId === actor.id) {
      if (!["DRAFT", "CHANGES_REQUESTED"].includes(String((proposal as any).status))) {
        throw new AppError(
          409,
          "Supporting Materials are locked while the Proposal is under review.",
          "PROPOSAL_LOCKED",
        );
      }
      return;
    }
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
  if (series) {
    if (String(series.status) === "ARCHIVED") {
      throw new AppError(409, "Series is archived and cannot be modified.", "SERIES_ARCHIVED");
    }
    if (series.deletedAt) {
      throw new AppError(409, "Series is deleted and cannot be modified.", "SERIES_DELETED");
    }
    if (!(await canMutateSeries(actor, series))) {
      const code =
        actor.role === "MANGAKA"
          ? "MANGAKA_OWNER_REQUIRED"
          : actor.role === "EDITOR"
            ? "TANTOU_ASSIGNMENT_REQUIRED"
            : "FORBIDDEN";
      throw new AppError(403, "You do not have permission to change this task.", code);
    }
    return;
  }
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
