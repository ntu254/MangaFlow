import { asyncRoute, created, ok, AppError } from "../lib/http.js";
import {
  ChapterModel,
  SeriesModel,
  StudioRegionModel,
  StudioTaskModel,
  StudioCommentModel,
  SubmissionModel,
  SeriesMemberModel,
} from "../db/models.js";
import { id, nowIso } from "../domain/ids.js";
import { audit } from "../services/audit.service.js";
import { createOutboxEvent } from "../services/workflow-support.service.js";
import {
  assertChapterContentUnlocked,
  assertCanMutateChapterById,
  assertCanMutateRegion,
  assertCanMutateSeriesById,
  assertCanMutateStudioPage,
  assertCanMutateTask,
  assertCanReadCommentById,
  assertCanReadCommentTarget,
  assertCanReadTask,
  commentScopeFilter,
  mergeScope,
  productionScopeFilter,
} from "../services/authorization.service.js";
import {
  applyTaskAction,
  assertTaskAssigneeEligible,
  taskDetail,
} from "../services/task-submission.service.js";
import { sendChapterToEditorReview } from "../services/chapter-review.service.js";
import { resolveActiveRate } from "../services/rate-table.service.js";
import {
  requireActor,
  filterFromQuery,
  patchById,
  paginated,
  validateAction,
} from "./helpers.js";
import { parseBody, sanitizePatch } from "../validators/common.js";
import {
  createRegionSchema,
  patchRegionSchema,
  createStudioTaskSchema,
  patchStudioTaskSchema,
  createCommentSchema,
  patchCommentSchema,
  replyCommentSchema,
} from "../validators/studio.schema.js";
import { TASK_ACTIONS } from "../types.js";
import type { AuthedRequest } from "../types.js";

async function assertCanMutateStudioTarget(
  req: AuthedRequest,
  body: Record<string, unknown>,
) {
  const actor = requireActor(req);
  if (typeof body.regionId === "string") {
    const region = await StudioRegionModel.findOne({
      id: body.regionId,
    }).lean();
    if (!region)
      throw new AppError(404, "Region not found.", "REGION_NOT_FOUND");
    await assertCanMutateRegion(actor, region);
    return;
  }
  if (typeof body.pageId === "string") {
    await assertCanMutateStudioPage(actor, body.pageId);
    return;
  }
  if (typeof body.chapterId === "string") {
    await assertCanMutateChapterById(actor, body.chapterId);
    return;
  }
  if (typeof body.seriesId === "string") {
    await assertCanMutateSeriesById(actor, body.seriesId);
    return;
  }
  throw new AppError(
    400,
    "A visible series, chapter, page, or region target is required.",
    "VALIDATION_ERROR",
  );
}

async function assertStudioTargetConsistency(body: Record<string, unknown>) {
  const seriesId =
    typeof body.seriesId === "string" ? body.seriesId : undefined;
  const chapterId =
    typeof body.chapterId === "string" ? body.chapterId : undefined;
  const pageId = typeof body.pageId === "string" ? body.pageId : undefined;
  const regionId =
    typeof body.regionId === "string" ? body.regionId : undefined;
  const taskId = typeof body.taskId === "string" ? body.taskId : undefined;

  let chapter: any = chapterId
    ? await ChapterModel.findOne({ id: chapterId }).lean()
    : pageId
      ? await ChapterModel.findOne({ "pages.id": pageId }).lean()
      : null;
  let regionTarget: any = null;
  if (chapterId && !chapter)
    throw new AppError(404, "Chapter not found.", "CHAPTER_NOT_FOUND");

  if (regionId) {
    regionTarget = (await StudioRegionModel.findOne({
      id: regionId,
    }).lean()) as any;
    if (!regionTarget)
      throw new AppError(404, "Region not found.", "REGION_NOT_FOUND");
    if (!chapter)
      chapter = await ChapterModel.findOne({
        id: regionTarget.chapterId,
      }).lean();
    if (
      seriesId &&
      regionTarget.seriesId &&
      String(regionTarget.seriesId) !== seriesId
    ) {
      throw new AppError(
        400,
        "Target references belong to different series.",
        "TARGET_MISMATCH",
      );
    }
    if (
      chapterId &&
      regionTarget.chapterId &&
      String(regionTarget.chapterId) !== chapterId
    ) {
      throw new AppError(
        400,
        "Target references belong to different chapters.",
        "TARGET_MISMATCH",
      );
    }
  }
  if (taskId) {
    const task = (await StudioTaskModel.findOne({ id: taskId }).lean()) as any;
    if (!task) throw new AppError(404, "Task not found.", "TASK_NOT_FOUND");
    if (!chapter && task.chapterId)
      chapter = await ChapterModel.findOne({ id: task.chapterId }).lean();
    if (seriesId && task.seriesId && String(task.seriesId) !== seriesId) {
      throw new AppError(
        400,
        "Target references belong to different series.",
        "TARGET_MISMATCH",
      );
    }
    if (chapterId && task.chapterId && String(task.chapterId) !== chapterId) {
      throw new AppError(
        400,
        "Task references belong to a different chapter.",
        "TARGET_MISMATCH",
      );
    }
    if (pageId && task.pageId && String(task.pageId) !== pageId) {
      throw new AppError(
        400,
        "Task references belong to a different page.",
        "TARGET_MISMATCH",
      );
    }
    if (regionId && task.regionId && String(task.regionId) !== regionId) {
      throw new AppError(
        400,
        "Task references belong to a different region.",
        "TARGET_MISMATCH",
      );
    }
  }
  if (pageId) {
    if (!chapter) throw new AppError(404, "Page not found.", "PAGE_NOT_FOUND");
    const page = ((chapter as any).pages ?? []).find(
      (item: any) => String(item.id) === pageId,
    );
    if (!page) throw new AppError(404, "Page not found.", "PAGE_NOT_FOUND");
  }
  if (
    regionTarget &&
    pageId &&
    regionTarget.pageId &&
    String(regionTarget.pageId) !== pageId
  ) {
    throw new AppError(
      400,
      "Target references belong to different pages.",
      "TARGET_MISMATCH",
    );
  }
  if (chapter && seriesId && String((chapter as any).seriesId) !== seriesId) {
    throw new AppError(
      400,
      "Target references belong to different series.",
      "TARGET_MISMATCH",
    );
  }
}

function isUsableSourceUrl(value: unknown) {
  if (typeof value !== "string") return false;
  const url = value.trim();
  return (
    url.startsWith("https://") ||
    url.startsWith("http://") ||
    url.startsWith("/") ||
    url.startsWith("data:image/")
  );
}

async function assertTaskPageHasSource(body: Record<string, unknown>) {
  if (typeof body.pageId !== "string") return;
  const chapter = (await ChapterModel.findOne({
    ...(typeof body.chapterId === "string" ? { id: body.chapterId } : {}),
    "pages.id": body.pageId,
  }).lean()) as any;
  const page = chapter?.pages?.find((item: any) => item.id === body.pageId);
  if (!page) throw new AppError(404, "Page not found.", "PAGE_NOT_FOUND");
  const hasFileKey =
    typeof page.fileKey === "string" && page.fileKey.trim().length > 0;
  if (!hasFileKey && !isUsableSourceUrl(page.fileUrl ?? page.imageUrl)) {
    throw new AppError(
      409,
      "Upload a source image for this page before assigning assistant work.",
      "PAGE_SOURCE_REQUIRED",
    );
  }
}

function rejectWorkflowStatusPatch(body: unknown) {
  if (
    body &&
    typeof body === "object" &&
    ("status" in body || "state" in body)
  ) {
    throw new AppError(
      400,
      "Status cannot be changed directly. Use the appropriate action endpoint.",
      "VALIDATION_ERROR",
    );
  }
}

async function resolveCommentSeries(comment: any) {
  if (comment.seriesId) {
    return SeriesModel.findOne({ id: String(comment.seriesId) }).lean();
  }
  if (comment.chapterId) {
    const chapter = (await ChapterModel.findOne({
      id: String(comment.chapterId),
    }).lean()) as any;
    if (chapter?.seriesId)
      return SeriesModel.findOne({ id: String(chapter.seriesId) }).lean();
  }
  if (comment.pageId || (comment.targetType === "PAGE" && comment.targetId)) {
    const pageId = String(comment.pageId ?? comment.targetId);
    const chapter = (await ChapterModel.findOne({
      "pages.id": pageId,
    }).lean()) as any;
    if (chapter?.seriesId)
      return SeriesModel.findOne({ id: String(chapter.seriesId) }).lean();
  }
  if (comment.targetType === "CHAPTER" && comment.targetId) {
    const chapter = (await ChapterModel.findOne({
      id: String(comment.targetId),
    }).lean()) as any;
    if (chapter?.seriesId)
      return SeriesModel.findOne({ id: String(chapter.seriesId) }).lean();
  }
  if (
    comment.regionId ||
    (comment.targetType === "REGION" && comment.targetId)
  ) {
    const region = (await StudioRegionModel.findOne({
      id: String(comment.regionId ?? comment.targetId),
    }).lean()) as any;
    if (region?.chapterId) {
      const chapter = (await ChapterModel.findOne({
        id: String(region.chapterId),
      }).lean()) as any;
      if (chapter?.seriesId)
        return SeriesModel.findOne({ id: String(chapter.seriesId) }).lean();
    }
  }
  if (comment.taskId || (comment.targetType === "TASK" && comment.targetId)) {
    const task = (await StudioTaskModel.findOne({
      id: String(comment.taskId ?? comment.targetId),
    }).lean()) as any;
    if (task?.seriesId)
      return SeriesModel.findOne({ id: String(task.seriesId) }).lean();
    if (task?.chapterId) {
      const chapter = (await ChapterModel.findOne({
        id: String(task.chapterId),
      }).lean()) as any;
      if (chapter?.seriesId)
        return SeriesModel.findOne({ id: String(chapter.seriesId) }).lean();
    }
  }
  if (comment.targetType === "SUBMISSION" && comment.targetId) {
    const submission = (await SubmissionModel.findOne({
      id: String(comment.targetId),
    }).lean()) as any;
    if (submission?.seriesId)
      return SeriesModel.findOne({ id: String(submission.seriesId) }).lean();
    const task = submission?.taskId
      ? ((await StudioTaskModel.findOne({
          id: String(submission.taskId),
        }).lean()) as any)
      : null;
    if (task?.seriesId)
      return SeriesModel.findOne({ id: String(task.seriesId) }).lean();
    const chapterId = submission?.chapterId ?? task?.chapterId;
    if (chapterId) {
      const chapter = (await ChapterModel.findOne({
        id: String(chapterId),
      }).lean()) as any;
      if (chapter?.seriesId)
        return SeriesModel.findOne({ id: String(chapter.seriesId) }).lean();
    }
  }
  return null;
}

function isBlockingComment(comment: any) {
  return Boolean(comment.isBlocking || comment.blocking);
}

function isTantouBlockingComment(comment: any, series?: any) {
  return (
    isBlockingComment(comment) &&
    (String(comment.authorRole ?? "").toUpperCase() === "EDITOR" ||
      (series?.editorId &&
        String(series.editorId) === String(comment.authorId)))
  );
}

async function assertAssignedTantouCanManageBlockingComment(
  req: AuthedRequest,
  comment: any,
) {
  const actor = requireActor(req);
  if (actor.role !== "EDITOR") {
    throw new AppError(
      403,
      "Only the assigned Tantou can create or manage blocking comments.",
      "TANTOU_ASSIGNMENT_REQUIRED",
    );
  }
  const series = (await resolveCommentSeries(comment)) as any;
  const tantouMembership = series
    ? await SeriesMemberModel.findOne({
        seriesId: series.id,
        userId: actor.id,
        role: "editor",
      }).lean()
    : null;
  const hasLegacySeriesAssignment =
    !tantouMembership &&
    series &&
    String(series.editorId ?? "") === String(actor.id);
  if (
    (tantouMembership as any)?.status !== "active" &&
    !hasLegacySeriesAssignment
  ) {
    throw new AppError(
      403,
      "Only the assigned Tantou can manage this comment.",
      "TANTOU_ASSIGNMENT_REQUIRED",
    );
  }
}

async function assertMangakaCanAddressComment(
  req: AuthedRequest,
  comment: any,
) {
  const actor = requireActor(req);
  if (actor.role !== "MANGAKA") {
    throw new AppError(
      403,
      "Only Mangaka can mark Tantou blocking comments addressed.",
      "FORBIDDEN",
    );
  }
  const series = (await resolveCommentSeries(comment)) as any;
  if (!isTantouBlockingComment(comment, series)) {
    throw new AppError(
      403,
      "Only Tantou blocking comments can be marked addressed.",
      "FORBIDDEN",
    );
  }
  if (!series || series.authorId !== actor.id) {
    throw new AppError(
      403,
      "Only the Mangaka owner can address this comment.",
      "MANGAKA_OWNER_REQUIRED",
    );
  }
}

async function assertEditorCanManageComment(req: AuthedRequest, comment: any) {
  const actor = requireActor(req);
  if (actor.role !== "EDITOR") {
    throw new AppError(
      403,
      "Only Tantou can resolve or reopen blocking comments.",
      "FORBIDDEN",
    );
  }
  const series = (await resolveCommentSeries(comment)) as any;
  if (!isTantouBlockingComment(comment, series)) {
    throw new AppError(
      403,
      "Only Tantou blocking comments can be resolved or reopened here.",
      "FORBIDDEN",
    );
  }
  await assertAssignedTantouCanManageBlockingComment(req, comment);
}

// Regions
export const listRegions = asyncRoute(async (req: AuthedRequest, res) =>
  paginated(
    req,
    res,
    StudioRegionModel,
    mergeScope(
      filterFromQuery(req),
      await productionScopeFilter(requireActor(req), "read"),
    ),
    { updatedAt: -1 },
  ),
);
export const createRegion = asyncRoute(async (req: AuthedRequest, res) => {
  if (req.actor?.role !== "MANGAKA") {
    throw new AppError(
      403,
      "Only Mangaka can create production regions.",
      "FORBIDDEN",
    );
  }
  const body = parseBody(createRegionSchema, req);
  if (!body.chapterId)
    throw new AppError(
      400,
      "chapterId is required for a region.",
      "VALIDATION_ERROR",
    );
  await assertStudioTargetConsistency(body as Record<string, unknown>);
  await assertCanMutateStudioTarget(req, body as Record<string, unknown>);
  const region = await StudioRegionModel.create({
    id: id("region"),
    ...body,
    status: "CONFIRMED",
    lockStatus: "UNLOCKED",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });
  await audit(req, "studio_region.create", "region", region.id);
  created(res, region);
});
export const patchRegions = asyncRoute(async (req: AuthedRequest, res) => {
  throw new AppError(
    410,
    "Bulk region patching is retired. Use the single-region endpoint.",
    "ENDPOINT_DEPRECATED",
  );
});
export const patchRegion = asyncRoute(async (req: AuthedRequest, res) => {
  if (req.actor?.role !== "MANGAKA") {
    throw new AppError(
      403,
      "Only Mangaka can edit production regions.",
      "FORBIDDEN",
    );
  }
  const body = parseBody(patchRegionSchema, req);
  rejectWorkflowStatusPatch(body);
  const existing = (await StudioRegionModel.findOne({
    id: String(req.params.id),
  }).lean()) as any;
  if (!existing)
    throw new AppError(404, "Region not found.", "REGION_NOT_FOUND");
  await assertCanMutateRegion(requireActor(req), existing);
  if (
    (body.seriesId || body.chapterId || body.pageId) &&
    (existing.activeTaskId || existing.lockedByTaskId || existing.taskId)
  ) {
    throw new AppError(
      409,
      "Assigned regions cannot change their target.",
      "REGION_ASSIGNED",
    );
  }
  if (body.seriesId || body.chapterId || body.pageId) {
    await assertStudioTargetConsistency(body as Record<string, unknown>);
    await assertCanMutateStudioTarget(req, body as Record<string, unknown>);
  }
  const allowedFields = [
    "seriesId",
    "chapterId",
    "pageId",
    "type",
    "x",
    "y",
    "width",
    "height",
    "label",
    "metadata",
  ];
  const patch = sanitizePatch(body as Record<string, unknown>, allowedFields, {
    rejectStatus: false,
  });
  ok(
    res,
    await patchById(
      req,
      StudioRegionModel,
      String(req.params.id),
      "studio_region.update",
      patch,
    ),
  );
});
export const deleteRegion = asyncRoute(async (req: AuthedRequest, res) => {
  if (req.actor?.role !== "MANGAKA") {
    throw new AppError(
      403,
      "Only Mangaka can delete production regions.",
      "FORBIDDEN",
    );
  }
  const id = String(req.params.id);
  const region = (await StudioRegionModel.findOne({ id }).lean()) as any;
  if (!region) throw new AppError(404, "Region not found.", "REGION_NOT_FOUND");
  await assertCanMutateRegion(requireActor(req), region);
  if (
    region.activeTaskId ||
    region.lockedByTaskId ||
    region.taskId ||
    region.submissionId
  ) {
    throw new AppError(
      409,
      "Assigned regions cannot be deleted.",
      "REGION_ASSIGNED",
    );
  }
  await StudioRegionModel.deleteOne({ id });
  await audit(req, "studio_region.delete", "region", id);
  ok(res, { id });
});

// Tasks
const PAGE_TASK_TERMINAL_STATUSES = [
  "REJECTED",
  "CANCELLED",
  "MANGAKA_APPROVED",
  "EDITOR_APPROVED",
  "COMPLETED",
];

function isDuplicatePageTaskError(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: unknown }).code === 11000,
  );
}

export const listTasks = asyncRoute(async (req: AuthedRequest, res) => {
  const filter = filterFromQuery(req);
  if (req.actor?.role === "ASSISTANT") {
    filter.assigneeId = req.actor.id;
  }
  await paginated(
    req,
    res,
    StudioTaskModel,
    mergeScope(filter, await productionScopeFilter(requireActor(req), "read")),
    { updatedAt: -1 },
  );
});
export const createTask = asyncRoute(async (req: AuthedRequest, res) => {
  const body = parseBody(createStudioTaskSchema, req);
  if (body.regionId) {
    throw new AppError(
      400,
      "Tasks are assigned to pages. Regions are only used for comments and coordinates.",
      "REGION_TASKS_RETIRED",
    );
  }
  await assertStudioTargetConsistency(body as Record<string, unknown>);
  await assertCanMutateStudioTarget(req, body as Record<string, unknown>);

  let assigneeName = body.assigneeName;
  if (body.assigneeId) {
    const assignee = await assertTaskAssigneeEligible(body, body.assigneeId);
    assigneeName = (assignee as any).name;
  }

  const taskChapter = await ChapterModel.findOne({ "pages.id": body.pageId })
    .select({ status: 1 })
    .lean();
  if (!taskChapter) throw new AppError(404, "Chapter not found.", "CHAPTER_NOT_FOUND");
  assertChapterContentUnlocked(taskChapter);
  await assertTaskPageHasSource(body as Record<string, unknown>);

  if (!body.rateCode) {
    throw new AppError(
      409,
      "An active rate must be selected before creating a task.",
      "RATE_CONFIGURATION_REQUIRED",
    );
  }
  const rate = (await resolveActiveRate(body.rateCode)) as any;

  const quantity = Number(body.quantity ?? 1);
  const rateSnapshot = Number(rate.amount);
  const estimatedAmount = quantity * rateSnapshot;
  const taskId = id("task");
  const activePageTask = await StudioTaskModel.findOne({
    pageId: body.pageId,
    $or: [
      { pageTaskActive: true },
      {
        pageTaskActive: { $exists: false },
        status: { $nin: PAGE_TASK_TERMINAL_STATUSES },
      },
    ],
  }).lean();
  if (activePageTask) {
    throw new AppError(
      409,
      "This page already has an active task.",
      "PAGE_HAS_ACTIVE_TASK",
    );
  }
  const taskBody = {
    ...body,
    targetScope: "PAGE",
    pageTaskActive: true,
    assigneeName,
    assignmentStatus: body.assigneeId ? "PENDING" : "UNASSIGNED",
    isRequired: body.isRequired ?? true,
    rateCode: rate.code,
    rateVersion: rate.version,
    workUnitType: rate.workUnitType,
    quantity,
    rateSnapshot,
    estimatedAmount,
    currency: rate.currency,
  };

  try {
    const task = await StudioTaskModel.create({
      id: taskId,
      ...taskBody,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    await audit(req, "studio_task.create", "task", task.id);
    await createOutboxEvent("task.assigned", "task", task.id, {
      taskId: task.id,
      assistantId: task.assigneeId,
    });
    created(res, task);
  } catch (error) {
    if (isDuplicatePageTaskError(error)) {
      throw new AppError(
        409,
        "This page already has an active task.",
        "PAGE_HAS_ACTIVE_TASK",
      );
    }
    throw error;
  }
});
export const patchTasks = asyncRoute(async (req: AuthedRequest, res) => {
  throw new AppError(
    410,
    "Bulk task patching is retired. Use the task action or single-task patch endpoint.",
    "ENDPOINT_DEPRECATED",
  );
});
export const patchTask = asyncRoute(async (req: AuthedRequest, res) => {
  const body = parseBody(patchStudioTaskSchema, req);
  const existing = await StudioTaskModel.findOne({
    id: String(req.params.id),
  }).lean();
  if (!existing) throw new AppError(404, "Task not found.", "TASK_NOT_FOUND");
  await assertCanMutateTask(requireActor(req), existing);
  rejectWorkflowStatusPatch(body);
  if ("rateCode" in body || "workUnitType" in body || "currency" in body) {
    throw new AppError(
      409,
      "Task rate snapshots and their source fields cannot be changed after task creation.",
      "RATE_SNAPSHOT_IMMUTABLE",
    );
  }
  if ("assigneeId" in body || "regionId" in body) {
    throw new AppError(
      400,
      "Assignee and region must be changed through task actions.",
      "PROTECTED_FIELD",
    );
  }
  if ("quantity" in body) {
    throw new AppError(
      409,
      "Task quantity is fixed when the page task is created.",
      "TASK_PRICING_IMMUTABLE",
    );
  }
  if (body.seriesId || body.chapterId || body.pageId) {
    await assertStudioTargetConsistency({
      taskId: String((existing as any).id),
      ...(existing as any),
      ...(body as any),
    });
    await assertCanMutateStudioTarget(req, body as Record<string, unknown>);
  }
  const allowedFields = [
    "seriesId",
    "chapterId",
    "pageId",
    "title",
    "description",
    "type",
    "priority",
    "dueAt",
    "isRequired",
    "metadata",
  ];
  const patch = sanitizePatch(body as Record<string, unknown>, allowedFields);
  if ("seriesId" in patch || "chapterId" in patch || "pageId" in patch) {
    await assertTaskAssigneeEligible(
      { ...existing, ...patch },
      String((existing as any).assigneeId),
    );
  }
  ok(
    res,
    await patchById(
      req,
      StudioTaskModel,
      String(req.params.id),
      "studio_task.update",
      patch,
    ),
  );
});
export const getTaskDetail = asyncRoute(async (req: AuthedRequest, res) =>
  ok(res, await taskDetail(req, String(req.params.taskId))),
);
export const getTaskDetailAlias = asyncRoute(async (req: AuthedRequest, res) =>
  ok(res, await taskDetail(req, String(req.params.taskId))),
);
export const taskAction = asyncRoute(async (req: AuthedRequest, res) =>
  ok(
    res,
    await applyTaskAction(
      req,
      String(req.params.taskId),
      validateAction(String(req.params.action), TASK_ACTIONS),
      req.body,
    ),
  ),
);
export const sendEditorReview = asyncRoute(async (req: AuthedRequest, res) =>
  ok(res, await sendChapterToEditorReview(req, String(req.params.chapterId))),
);

// Comments
export const listComments = asyncRoute(async (req: AuthedRequest, res) => {
  await paginated(
    req,
    res,
    StudioCommentModel,
    mergeScope(
      filterFromQuery(req),
      await commentScopeFilter(requireActor(req)),
    ),
    { createdAt: -1 },
  );
});
export const createComment = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const body = parseBody(createCommentSchema, req);
  await assertStudioTargetConsistency(body as Record<string, unknown>);
  await assertCanReadCommentTarget(actor, body);
  if (isBlockingComment(body))
    await assertAssignedTantouCanManageBlockingComment(req, body);
  const comment = await StudioCommentModel.create({
    id: id("cmt"),
    ...body,
    authorId: actor.id,
    authorName: actor.name,
    authorRole: actor.role,
    text: body.text ?? body.body,
    body: body.body ?? body.text,
    status: "OPEN",
    createdAt: nowIso(),
  });
  await audit(req, "comment.create", "comment", (comment as any).id);
  created(res, comment);
});
export const replyToComment = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const parent = (await assertCanReadCommentById(
    actor,
    String(req.params.commentId),
  )) as any;
  const body = parseBody(replyCommentSchema, req);
  const text = String(body.body ?? body.text).trim();
  const reply = await StudioCommentModel.create({
    id: id("cmt"),
    seriesId: parent.seriesId,
    chapterId: parent.chapterId,
    pageId: parent.pageId,
    regionId: parent.regionId,
    taskId: parent.taskId,
    targetType: parent.targetType,
    targetId: parent.targetId,
    targetVersionId: parent.targetVersionId,
    parentCommentId: parent.id,
    authorId: actor.id,
    authorName: actor.name,
    authorRole: actor.role,
    body: text,
    text,
    status: "OPEN",
    isBlocking: false,
    createdAt: nowIso(),
  });
  await audit(req, "comment.reply", "comment", (reply as any).id, {
    parentCommentId: parent.id,
  });
  created(res, reply);
});
export const patchComment = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const comment = await assertCanReadCommentById(
    actor,
    String(req.params.commentId),
  );
  if ((comment as any).authorId !== actor.id) {
    throw new AppError(
      403,
      "Only the comment author can edit this comment.",
      "FORBIDDEN",
    );
  }
  const body = parseBody(patchCommentSchema, req);
  const allowedFields = [
    "text",
    "body",
    "type",
    "severity",
    "isBlocking",
    "metadata",
  ];
  const patch = sanitizePatch(body as Record<string, unknown>, allowedFields, {
    rejectStatus: false,
  });
  if (isBlockingComment({ ...comment, ...patch })) {
    await assertAssignedTantouCanManageBlockingComment(req, {
      ...comment,
      ...patch,
    });
  }
  ok(
    res,
    await patchById(
      req,
      StudioCommentModel,
      String(req.params.commentId),
      "comment.update",
      patch,
    ),
  );
});
export const resolveComment = asyncRoute(async (req: AuthedRequest, res) => {
  const comment = (await StudioCommentModel.findOne({
    id: String(req.params.commentId),
  }).lean()) as any;
  if (!comment)
    throw new AppError(404, "Comment not found.", "COMMENT_NOT_FOUND");
  await assertEditorCanManageComment(req, comment);
  ok(
    res,
    await patchById(
      req,
      StudioCommentModel,
      String(req.params.commentId),
      "comment.resolved",
      {
        status: "RESOLVED",
      },
    ),
  );
});
export const addressComment = asyncRoute(async (req: AuthedRequest, res) => {
  const comment = (await StudioCommentModel.findOne({
    id: String(req.params.commentId),
  }).lean()) as any;
  if (!comment)
    throw new AppError(404, "Comment not found.", "COMMENT_NOT_FOUND");
  await assertMangakaCanAddressComment(req, comment);
  ok(
    res,
    await patchById(
      req,
      StudioCommentModel,
      String(req.params.commentId),
      "comment.addressed",
      {
        status: "ADDRESSED",
      },
    ),
  );
});
export const reopenComment = asyncRoute(async (req: AuthedRequest, res) => {
  const comment = (await StudioCommentModel.findOne({
    id: String(req.params.commentId),
  }).lean()) as any;
  if (!comment)
    throw new AppError(404, "Comment not found.", "COMMENT_NOT_FOUND");
  await assertEditorCanManageComment(req, comment);
  if (!["ADDRESSED", "RESOLVED"].includes(comment.status)) {
    throw new AppError(
      409,
      "Only addressed or resolved comments can be reopened.",
      "INVALID_TRANSITION",
    );
  }
  ok(
    res,
    await patchById(
      req,
      StudioCommentModel,
      String(req.params.commentId),
      "comment.reopened",
      {
        status: "REOPENED",
      },
    ),
  );
});
export const listTaskComments = asyncRoute(async (req: AuthedRequest, res) => {
  const task = await StudioTaskModel.findOne({
    id: String(req.params.taskId),
  }).lean();
  if (!task) throw new AppError(404, "Task not found.", "TASK_NOT_FOUND");
  await assertCanReadTask(requireActor(req), task);
  ok(
    res,
    await StudioCommentModel.find({ taskId: String(req.params.taskId) })
      .sort({ createdAt: -1 })
      .lean(),
  );
});
