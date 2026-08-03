import crypto from "node:crypto";
import {
  ChapterModel,
  SeriesMemberModel,
  SeriesModel,
  StudioRegionModel,
  StudioTaskModel,
  SubmissionModel,
  UserModel,
} from "../db/models.js";
import { id, nowIso } from "../domain/ids.js";
import { AppError } from "../lib/http.js";
import type { AuthedRequest, RequestActor } from "../types.js";
import { audit } from "./audit.service.js";
import {
  assertChapterContentUnlocked,
  assertCanMutateTask,
  assertCanReadTask,
} from "./authorization.service.js";
import { recordTaskEarning } from "./earning.service.js";
import {
  createAuditEntry,
  createOutboxEvent,
  runWorkflowTransaction,
  toObject,
} from "./workflow-support.service.js";

function ensureActor(req: AuthedRequest) {
  if (!req.actor)
    throw new AppError(401, "Missing authenticated user.", "MISSING_AUTH");
  return req.actor;
}

function isAssignedAssistant(actor: RequestActor, task: any) {
  return actor.role === "ASSISTANT" && task.assigneeId === actor.id;
}

async function assertTaskSeriesActive(task: any) {
  const series = task.seriesId
    ? await SeriesModel.findOne({ id: task.seriesId }).lean()
    : task.chapterId
      ? await ChapterModel.findOne({ id: task.chapterId }).lean().then((chapter: any) =>
          chapter ? SeriesModel.findOne({ id: chapter.seriesId }).lean() : null,
        )
      : null;
  if (series?.status === "ARCHIVED") {
    throw new AppError(409, "Series is archived and its tasks are read-only.", "SERIES_ARCHIVED");
  }
}

function isTaskAssignmentAccepted(task: any) {
  // Existing tasks predate assignmentStatus and are already in progress under the old flow.
  return task.assignmentStatus == null || task.assignmentStatus === "ACCEPTED";
}

function assertTaskAssignmentAccepted(task: any) {
  if (!isTaskAssignmentAccepted(task)) {
    throw new AppError(
      409,
      "The assigned assistant must accept this task before starting work.",
      "TASK_ASSIGNMENT_NOT_ACCEPTED",
    );
  }
}

async function assertTaskChapterContentUnlocked(task: any, session?: any) {
  const filter = task.chapterId
    ? { id: String(task.chapterId) }
    : { "pages.id": String(task.pageId) };
  const query = ChapterModel.findOne(filter).select({ status: 1 });
  if (session) query.session(session);
  const chapter = await query.lean();
  if (!chapter) throw new AppError(404, "Chapter not found.", "CHAPTER_NOT_FOUND");
  assertChapterContentUnlocked(chapter);
}

async function taskSeriesId(task: any) {
  const seriesIds: string[] = [];
  const addSeriesId = (seriesId: unknown) => {
    if (seriesId) seriesIds.push(String(seriesId));
  };
  if (task.pageId) {
    const chapter = (await ChapterModel.findOne({
      "pages.id": String(task.pageId),
    }).lean()) as any;
    if (!chapter) throw new AppError(404, "Page not found.", "PAGE_NOT_FOUND");
    addSeriesId(chapter?.seriesId);
  }
  if (task.chapterId) {
    const chapter = (await ChapterModel.findOne({
      id: String(task.chapterId),
    }).lean()) as any;
    if (!chapter)
      throw new AppError(404, "Chapter not found.", "CHAPTER_NOT_FOUND");
    addSeriesId(chapter?.seriesId);
  }
  if (task.seriesId) {
    const series = (await SeriesModel.findOne({
      id: String(task.seriesId),
    }).lean()) as any;
    if (!series)
      throw new AppError(404, "Series not found.", "SERIES_NOT_FOUND");
    addSeriesId(series.id);
  }
  const uniqueSeriesIds = [...new Set(seriesIds)];
  if (uniqueSeriesIds.length > 1) {
    throw new AppError(
      400,
      "Task target series must be consistent.",
      "TASK_SERIES_MISMATCH",
    );
  }
  return uniqueSeriesIds[0] ?? null;
}

export async function assertTaskAssigneeEligible(
  task: any,
  assigneeId: string,
) {
  const assignee = await UserModel.findOne({ id: assigneeId }).lean();
  if (!assignee)
    throw new AppError(404, "Assignee not found.", "ASSIGNEE_NOT_FOUND");
  const seriesId = await taskSeriesId(task);
  if (!seriesId)
    throw new AppError(404, "Task series not found.", "SERIES_NOT_FOUND");
  const member = await SeriesMemberModel.findOne({
    seriesId,
    userId: assigneeId,
    role: "assistant",
    status: "active",
  }).lean();
  if ((assignee as any).role !== "ASSISTANT" || !member) {
    throw new AppError(
      403,
      "Assignee must be an active assistant series member.",
      "ASSIGNEE_NOT_ELIGIBLE",
    );
  }
  return assignee;
}

function assertTaskActionAllowed(
  actor: RequestActor,
  task: any,
  action: string,
) {
  const normalized = action.toUpperCase();
  if (new Set(["BLOCK", "MARK_BLOCKED", "UNBLOCK"]).has(normalized)) {
    throw new AppError(
      400,
      "Task block and unblock actions are no longer supported.",
      "INVALID_ACTION",
    );
  }
  const assistantActions = new Set(["START", "REOPEN"]);
  if (
    isAssignedAssistant(actor, task) &&
    ["ACCEPT", "REJECT"].includes(normalized)
  )
    return;
  if (isAssignedAssistant(actor, task) && assistantActions.has(normalized)) {
    assertTaskAssignmentAccepted(task);
    return;
  }
  if (normalized === "REASSIGN" || normalized === "CANCEL") {
    if (actor.role !== "MANGAKA") {
      throw new AppError(
        403,
        "Only the owning Mangaka can reassign or cancel assistant tasks.",
        "FORBIDDEN",
      );
    }
    return;
  }
  if (actor.role === "ASSISTANT" && task.assigneeId !== actor.id) {
    throw new AppError(
      403,
      "Task is not assigned to the current assistant.",
      "TASK_NOT_ASSIGNED",
    );
  }
  if (actor.role === "ASSISTANT") {
    throw new AppError(
      403,
      "Assistants cannot perform this task action.",
      "FORBIDDEN",
    );
  }
  throw new AppError(
    403,
    "Only the assigned Assistant or owning Mangaka can perform this task action.",
    "FORBIDDEN",
  );
}

// On Mangaka approval, promote the approved submission's asset to be the
// chapter page image so the "Pages uploaded" preview reflects the accepted work
// without a manual reload. Only runs when the work targets a page and carries a
// file asset.
async function applyApprovedSubmissionToPage(
  submission: any,
  task: any,
  session: any,
) {
  const pageId = submission?.pageId ?? task?.pageId;
  const fileKey = submission?.fileKey;
  const fileUrl = submission?.fileUrl ?? submission?.imageUrl;
  const imageUrl = submission?.imageUrl ?? submission?.fileUrl;
  if (!pageId || (!fileKey && !fileUrl && !imageUrl)) return;

  const chapter = (await ChapterModel.findOne({ "pages.id": String(pageId) })
    .session(session)
    .lean()) as any;
  if (!chapter) return;

  const now = nowIso();
  const pages = (chapter.pages ?? []).map((page: any) => {
    if (String(page.id) !== String(pageId)) return page;
    return {
      ...page,
      fileKey: fileKey ?? page.fileKey,
      fileUrl: fileUrl ?? page.fileUrl,
      imageUrl: imageUrl ?? page.imageUrl,
      fileName: submission?.fileName ?? page.fileName,
      mimeType: submission?.mimeType ?? page.mimeType,
      sizeKB:
        typeof submission?.fileSizeKB === "number"
          ? submission.fileSizeKB
          : page.sizeKB,
      status: "UPLOADED",
      uploadedAt: now,
      updatedAt: now,
    };
  });
  await ChapterModel.updateOne(
    { id: chapter.id },
    { $set: { pages, updatedAt: now } },
    { session },
  );
}

async function assertSubmissionMatchesTaskScope(task: any, payload: any) {
  const scopedFields = ["seriesId", "chapterId", "pageId"];
  for (const field of scopedFields) {
    if (
      payload?.[field] != null &&
      task?.[field] != null &&
      String(payload[field]) !== String(task[field])
    ) {
      throw new AppError(
        400,
        `Submission ${field} must match the assigned task.`,
        "CROSS_ENTITY_ATTACHMENT",
      );
    }
  }
  const fileKey =
    typeof payload?.fileKey === "string" ? payload.fileKey.trim() : "";
  if (!fileKey) return;
  const ownerChapter = (await ChapterModel.findOne({
    pages: { $elemMatch: { fileKey } },
  }).lean()) as any;
  if (!ownerChapter) return;
  const ownerPage = ((ownerChapter.pages ?? []) as any[]).find(
    (page) => page.fileKey === fileKey,
  );
  if (
    (task.chapterId && String(ownerChapter.id) !== String(task.chapterId)) ||
    (task.pageId &&
      ownerPage?.id &&
      String(ownerPage.id) !== String(task.pageId))
  ) {
    throw new AppError(
      400,
      "Submission file belongs to a different chapter/page.",
      "CROSS_ENTITY_ATTACHMENT",
    );
  }
}

function stableJson(value: unknown): string {
  if (Array.isArray(value))
    return `[${value.map((item) => stableJson(item)).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value as Record<string, unknown>)
      .sort()
      .map(
        (key) =>
          `${JSON.stringify(key)}:${stableJson((value as Record<string, unknown>)[key])}`,
      )
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function requestFingerprint(value: unknown) {
  return crypto.createHash("sha256").update(stableJson(value)).digest("hex");
}

function isCanonicalRevisionStatus(value: unknown) {
  return value === "REVISION_REQUESTED";
}

function currentSubmissionMatch(currentSubmissionId: unknown) {
  return currentSubmissionId == null
    ? {
        $or: [
          { currentSubmissionId: null },
          { currentSubmissionId: { $exists: false } },
        ],
      }
    : { currentSubmissionId };
}

export async function applyTaskAction(
  req: AuthedRequest,
  taskId: string,
  action: string,
  payload: any = {},
) {
  const actor = ensureActor(req);
  const doc = await StudioTaskModel.findOne({ id: taskId });
  if (!doc) throw new AppError(404, "Task not found.", "TASK_NOT_FOUND");
  const task = doc.toObject() as any;
  await assertTaskSeriesActive(task);
  const normalizedAction = action.toUpperCase();
  assertTaskActionAllowed(actor, task, action);
  if (actor.role !== "ASSISTANT") await assertCanMutateTask(actor, task);
  if (normalizedAction === "REOPEN") return reopenTaskForRevision(req, taskId);

  const patch: Record<string, unknown> = { updatedAt: nowIso() };
  switch (normalizedAction) {
    case "ACCEPT":
      if (task.assignmentStatus !== "PENDING") {
        throw new AppError(
          409,
          "Only pending assignments can be accepted.",
          "TASK_ASSIGNMENT_NOT_PENDING",
        );
      }
      patch.assignmentStatus = "ACCEPTED";
      patch.assignmentAcceptedAt = new Date();
      patch.assignmentAcceptedById = actor.id;
      patch.assignmentRejectedAt = null;
      patch.assignmentRejectedById = null;
      patch.assignmentRejectedReason = null;
      break;
    case "REJECT": {
      if (task.assignmentStatus !== "PENDING") {
        throw new AppError(
          409,
          "Only pending assignments can be rejected.",
          "TASK_ASSIGNMENT_NOT_PENDING",
        );
      }
      const reason = String(
        payload.reason ?? payload.rejectReason ?? "",
      ).trim();
      if (!reason) {
        throw new AppError(
          400,
          "A rejection reason is required.",
          "REASON_REQUIRED",
        );
      }
      patch.assignmentStatus = "REJECTED";
      patch.assignmentRejectedAt = new Date();
      patch.assignmentRejectedById = actor.id;
      patch.assignmentRejectedReason = reason;
      break;
    }
    case "START":
      if (task.status !== "TODO") {
        throw new AppError(
          409,
          "Only TODO tasks can be started.",
          "INVALID_TRANSITION",
        );
      }
      patch.status = "IN_PROGRESS";
      patch.startedAt = new Date();
      break;
    case "CANCEL":
      if (
        !["TODO", "IN_PROGRESS", "SUBMITTED", "REVISION_REQUESTED"].includes(
          String(task.status),
        )
      ) {
        throw new AppError(
          409,
          "Only active tasks can be cancelled.",
          "INVALID_TRANSITION",
        );
      }
      patch.status = "CANCELLED";
      patch.cancelledAt = new Date();
      patch.cancelledById = actor.id;
      patch.cancelReason = payload.cancelReason ?? payload.reason ?? "";
      patch.pageTaskActive = false;
      break;
    case "REASSIGN": {
      if (task.status !== "TODO") {
        throw new AppError(
          409,
          "A task can only be reassigned before the assistant starts work.",
          "REASSIGN_AFTER_START_NOT_ALLOWED",
        );
      }
      if (!payload.newAssigneeId) {
        throw new AppError(
          400,
          "newAssigneeId is required.",
          "VALIDATION_ERROR",
        );
      }
      const newAssignee = await assertTaskAssigneeEligible(
        task,
        payload.newAssigneeId,
      );
      patch.assigneeId = payload.newAssigneeId;
      patch.assigneeName = (newAssignee as any).name;
      patch.pageTaskActive = true;
      patch.assignmentStatus = "PENDING";
      patch.assignmentAcceptedAt = null;
      patch.assignmentAcceptedById = null;
      patch.assignmentRejectedAt = null;
      patch.assignmentRejectedById = null;
      patch.assignmentRejectedReason = null;
      patch.reassigned = true;
      patch.reassignedFromId = task.assigneeId ?? null;
      patch.reassignedFromName = task.assigneeName ?? null;
      patch.reassignedToId = payload.newAssigneeId;
      patch.reassignedToName = (newAssignee as any).name;
      patch.reassignedAt = new Date();
      patch.reassignmentReason = String(
        payload.reason ?? payload.reassignmentReason ?? "",
      ).trim();
      break;
    }
    default:
      throw new AppError(
        400,
        `Unknown task action: ${action}`,
        "INVALID_ACTION",
      );
  }
  const updateFilter: Record<string, unknown> = {
    id: taskId,
    status: task.status,
  };
  if (normalizedAction === "ACCEPT" || normalizedAction === "REJECT") {
    updateFilter.assignmentStatus = "PENDING";
  }
  return runWorkflowTransaction(async (session) => {
    const updatedTask = await StudioTaskModel.updateOne(
      updateFilter,
      { $set: patch },
      { session },
    );
    if (updatedTask.modifiedCount !== 1) {
      throw new AppError(409, "Task changed while applying action.", "CONFLICT");
    }
    if (normalizedAction === "CANCEL") {
      await StudioRegionModel.updateMany(
        {
          $or: [
            { taskId },
            { activeTaskId: taskId },
            { lockedByTaskId: taskId },
          ],
        } as any,
        {
          $set: {
            activeTaskId: null,
            lockedByTaskId: null,
            lockStatus: "UNLOCKED",
            updatedAt: nowIso(),
          },
        },
        { session },
      );
    }
    if (normalizedAction === "REASSIGN") {
      await audit(req, "TASK_ASSIGNED", "task", taskId, {
        fromAssignee: task.assigneeId,
        toAssignee: payload.newAssigneeId,
      }, session);
    }
    await audit(req, `task.${action.toLowerCase()}`, "task", taskId, {
      fromStatus: task.status,
      toStatus: patch.status ?? task.status,
    }, session);
    const taskEventType =
      normalizedAction === "ACCEPT"
        ? "task.assignment.accepted"
        : normalizedAction === "REJECT"
          ? "task.assignment.rejected"
          : normalizedAction === "REASSIGN"
            ? "task.reassigned"
            : normalizedAction === "CANCEL"
              ? "task.cancelled"
              : undefined;
    if (taskEventType) {
      await createOutboxEvent(
        taskEventType,
        "task",
        taskId,
        {
          taskId,
          assistantId:
            normalizedAction === "REASSIGN"
              ? String(payload.newAssigneeId)
              : task.assigneeId,
          previousAssistantId: task.assigneeId,
          reason:
            payload.reason ?? payload.rejectReason ?? payload.cancelReason ?? null,
        },
        session,
      );
    }
    return toObject(await StudioTaskModel.findOne({ id: taskId }).session(session).lean());
  });
}

export async function reopenTaskForRevision(
  req: AuthedRequest,
  taskId: string,
) {
  const actor = ensureActor(req);
  const task = (await StudioTaskModel.findOne({ id: taskId }).lean()) as any;
  if (!task) throw new AppError(404, "Task not found.", "TASK_NOT_FOUND");
  if (!isAssignedAssistant(actor, task)) {
    throw new AppError(
      403,
      "Task is not assigned to the current assistant.",
      "TASK_NOT_ASSIGNED",
    );
  }
  assertTaskAssignmentAccepted(task);
  if (!isCanonicalRevisionStatus(task.status)) {
    throw new AppError(
      409,
      "Only revision-requested tasks can be reopened.",
      "INVALID_TRANSITION",
    );
  }
  return runWorkflowTransaction(async (session) => {
    const updated = await StudioTaskModel.findOneAndUpdate(
      { id: taskId, assigneeId: actor.id, status: task.status },
      {
        $set: {
          status: "IN_PROGRESS",
          updatedAt: nowIso(),
        },
      },
      { returnDocument: "after", session },
    ).lean();
    if (!updated)
      throw new AppError(409, "Task changed while reopening.", "CONFLICT");
    await audit(req, "TASK_REOPENED_FOR_REVISION", "task", taskId, {
      fromStatus: task.status,
    }, session);
    await createOutboxEvent("task.reopened", "task", taskId, {
      assistantId: actor.id,
    }, session);
    return toObject(updated);
  });
}

export async function submitTaskWork(
  req: AuthedRequest,
  taskId: string,
  payload: any = {},
) {
  const actor = ensureActor(req);
  if (actor.role !== "ASSISTANT") {
    throw new AppError(
      403,
      "Only the assigned assistant can submit task work.",
      "FORBIDDEN",
    );
  }
  const idempotencyKey = String(
    req.header("Idempotency-Key") ?? payload.idempotencyKey ?? "",
  ).trim();
  if (!idempotencyKey) {
    throw new AppError(
      400,
      "Idempotency-Key header is required.",
      "IDEMPOTENCY_KEY_REQUIRED",
    );
  }
  if (
    !Object.prototype.hasOwnProperty.call(
      payload,
      "expectedCurrentSubmissionId",
    )
  ) {
    throw new AppError(
      400,
      "expectedCurrentSubmissionId is required.",
      "EXPECTED_CURRENT_SUBMISSION_REQUIRED",
    );
  }
  const fingerprint = requestFingerprint({
    expectedCurrentSubmissionId: payload.expectedCurrentSubmissionId ?? null,
    seriesId: payload.seriesId,
    chapterId: payload.chapterId,
    pageId: payload.pageId,
    pageVersionId: payload.pageVersionId,
    notes: payload.notes,
    fileKey: payload.fileKey,
    fileName: payload.fileName,
    fileUrl: payload.fileUrl ?? payload.imageUrl,
    imageUrl: payload.imageUrl ?? payload.fileUrl,
    fileSizeKB: payload.fileSizeKB,
    mimeType: payload.mimeType,
    metadata: payload.metadata,
  });
  const task = (await StudioTaskModel.findOne({ id: taskId }).lean()) as any;
  if (!task) throw new AppError(404, "Task not found.", "TASK_NOT_FOUND");
  if (!isAssignedAssistant(actor, task)) {
    throw new AppError(
      403,
      "Task is not assigned to the current assistant.",
      "TASK_NOT_ASSIGNED",
    );
  }
  assertTaskAssignmentAccepted(task);
  await assertTaskChapterContentUnlocked(task);
  await assertSubmissionMatchesTaskScope(task, payload);
  const existingByKey = await SubmissionModel.findOne({
    taskId,
    idempotencyKey,
  }).lean();
  if (existingByKey) {
    if (
      (existingByKey as any).requestFingerprint &&
      (existingByKey as any).requestFingerprint !== fingerprint
    ) {
      throw new AppError(
        409,
        "Idempotency-Key was already used with a different payload.",
        "IDEMPOTENCY_KEY_REUSED",
      );
    }
    return toObject(existingByKey);
  }
  if (task.status !== "IN_PROGRESS") {
    throw new AppError(
      409,
      "Task must be IN_PROGRESS before submission.",
      "INVALID_TRANSITION",
    );
  }
  const expectedCurrentSubmissionId =
    payload.expectedCurrentSubmissionId ?? null;
  const currentSubmissionId = task.currentSubmissionId ?? null;
  if (
    String(expectedCurrentSubmissionId ?? "") !==
    String(currentSubmissionId ?? "")
  ) {
    throw new AppError(
      409,
      "Task current submission changed. Refresh and try again.",
      "CURRENT_SUBMISSION_CONFLICT",
    );
  }
  return runWorkflowTransaction(async (session) => {
    await assertTaskChapterContentUnlocked(task, session);
    const existingByKeyInTx = await SubmissionModel.findOne({
      taskId,
      idempotencyKey,
    })
      .session(session)
      .lean();
    if (existingByKeyInTx) {
      if (
        (existingByKeyInTx as any).requestFingerprint &&
        (existingByKeyInTx as any).requestFingerprint !== fingerprint
      ) {
        throw new AppError(
          409,
          "Idempotency-Key was already used with a different payload.",
          "IDEMPOTENCY_KEY_REUSED",
        );
      }
      return toObject(existingByKeyInTx);
    }
    const existingVersions = await SubmissionModel.find({ taskId })
      .select({ submissionVersion: 1, version: 1 })
      .session(session)
      .lean();
    const nextVersion =
      Math.max(
        0,
        ...existingVersions.map((item: any) =>
          Number(item.submissionVersion ?? item.version ?? 0),
        ),
      ) + 1;
    const now = nowIso();
    const taskMatch = {
      id: taskId,
      assigneeId: actor.id,
      status: "IN_PROGRESS",
      ...currentSubmissionMatch(currentSubmissionId),
    };
    const claim = await StudioTaskModel.updateOne(
      taskMatch as any,
      { $set: { updatedAt: now } },
      { session },
    );
    if (claim.matchedCount !== 1) {
      throw new AppError(409, "Task changed while submitting.", "CONFLICT");
    }
    await SubmissionModel.updateMany(
      {
        taskId,
        status: { $in: ["PENDING", "REVISION_REQUESTED"] },
      },
      { $set: { status: "SUPERSEDED", updatedAt: now } },
      { session },
    );
    const [submission] = await (SubmissionModel as any).create(
      [
        {
          id: id("sub"),
          taskId,
          seriesId: payload.seriesId ?? task.seriesId,
          chapterId: payload.chapterId ?? task.chapterId,
          pageId: payload.pageId ?? task.pageId,
          pageVersionId: payload.pageVersionId,
          assistantId: actor.id,
          assistantName: actor.name,
          submittedBy: { id: actor.id, name: actor.name, role: actor.role },
          submittedAt: now,
          version: nextVersion,
          submissionVersion: nextVersion,
          versionLabel: `v${nextVersion}`,
          idempotencyKey,
          requestFingerprint: fingerprint,
          status: "PENDING",
          resultText: payload.notes,
          fileKey: payload.fileKey,
          fileName: payload.fileName,
          fileUrl: payload.fileUrl ?? payload.imageUrl,
          imageUrl: payload.imageUrl ?? payload.fileUrl,
          fileSizeKB: payload.fileSizeKB,
          mimeType: payload.mimeType,
          metadata: payload.metadata,
          createdAt: now,
          updatedAt: now,
        },
      ],
      { session },
    );
    const taskUpdate = await StudioTaskModel.updateOne(
      taskMatch as any,
      {
        $set: {
          status: "SUBMITTED",
          currentSubmissionId: (submission as any).id,
          submittedAt: new Date(),
          updatedAt: now,
        },
      },
      { session },
    );
    if (taskUpdate.modifiedCount !== 1) {
      throw new AppError(
        409,
        "Task changed while finalizing submission.",
        "CONFLICT",
      );
    }
    await createAuditEntry(
      req,
      "TASK_SUBMITTED",
      "task",
      taskId,
      { submissionId: (submission as any).id, submissionVersion: nextVersion },
      session,
    );
    await createAuditEntry(
      req,
      "submission.create",
      "submission",
      (submission as any).id,
      { taskId, status: "PENDING", submissionVersion: nextVersion },
      session,
    );
    await createOutboxEvent(
      "task.submitted",
      "task",
      taskId,
      { submissionId: (submission as any).id, assistantId: actor.id },
      session,
    );
    return toObject(submission);
  });
}

export async function submissionDecision(
  req: AuthedRequest,
  submissionId: string,
  action: "approve" | "reject" | "request-revision",
  note?: string,
) {
  const actor = ensureActor(req);
  const existingDoc = await SubmissionModel.findOne({
    id: submissionId,
  }).lean();
  if (!existingDoc)
    throw new AppError(404, "Submission not found.", "SUBMISSION_NOT_FOUND");
  const submission = existingDoc as any;
  if (action === "approve" && submission.assistantId === actor.id) {
    throw new AppError(
      403,
      "You cannot approve a submission you submitted yourself.",
      "SELF_APPROVAL_BLOCKED",
    );
  }
  if (actor.role !== "MANGAKA") {
    throw new AppError(
      403,
      "Only Mangaka can review assistant submissions.",
      "FORBIDDEN",
    );
  }
  const task = (await StudioTaskModel.findOne({
    id: submission.taskId,
  }).lean()) as any;
  if (!task) throw new AppError(404, "Task not found.", "TASK_NOT_FOUND");
  await assertCanMutateTask(actor, task);
  if (task.currentSubmissionId !== submission.id) {
    throw new AppError(
      409,
      "Only the current task submission can be reviewed.",
      "NOT_CURRENT_SUBMISSION",
    );
  }
  let status: string = "PENDING";
  const reviewPatch: Record<string, unknown> = {};
  if (action === "approve") {
    status = "MANGAKA_APPROVED";
    reviewPatch.mangakaDecision = "APPROVED";
    reviewPatch.mangakaNote = note;
    reviewPatch.mangakaReviewedById = actor.id;
    reviewPatch.mangakaReviewedAt = new Date();
  } else if (action === "reject") {
    status = "REJECTED";
    reviewPatch.mangakaNote = note;
    reviewPatch.mangakaReviewedById = actor.id;
    reviewPatch.mangakaReviewedAt = new Date();
  } else if (action === "request-revision") {
    status = "REVISION_REQUESTED";
    reviewPatch.mangakaNote = note;
    reviewPatch.mangakaReviewedById = actor.id;
    reviewPatch.mangakaReviewedAt = new Date();
  }
  return runWorkflowTransaction(async (session) => {
    const currentSubmission = await SubmissionModel.findOne({
      id: submissionId,
    })
      .session(session)
      .lean();
    if (!currentSubmission)
      throw new AppError(404, "Submission not found.", "SUBMISSION_NOT_FOUND");
    const currentTask = (await StudioTaskModel.findOne({
      id: submission.taskId,
    })
      .session(session)
      .lean()) as any;
    if (!currentTask)
      throw new AppError(404, "Task not found.", "TASK_NOT_FOUND");
    if (currentTask.currentSubmissionId !== submission.id) {
      throw new AppError(
        409,
        "Only the current task submission can be reviewed.",
        "NOT_CURRENT_SUBMISSION",
      );
    }
    if (
      String((currentSubmission as any).status) !== "PENDING" ||
      String(currentTask.status) !== "SUBMITTED"
    ) {
      throw new AppError(
        409,
        "Only a pending submission on a submitted task can be reviewed.",
        "INVALID_TRANSITION",
      );
    }
    const updated = await SubmissionModel.findOneAndUpdate(
      {
        id: submissionId,
        taskId: task.id,
        status: "PENDING",
      },
      {
        $set: {
          status,
          ...reviewPatch,
        },
      },
      { returnDocument: "after", session },
    ).lean();
    if (!updated)
      throw new AppError(
        409,
        "Submission changed while reviewing.",
        "CONFLICT",
      );
    if (status === "MANGAKA_APPROVED") {
      const taskUpdate = await StudioTaskModel.updateOne(
        { id: submission.taskId, currentSubmissionId: submission.id },
        {
          $set: {
            status: "MANGAKA_APPROVED",
            mangakaReviewedAt: new Date(),
            mangakaReviewedById: actor.id,
            updatedAt: nowIso(),
          },
        },
        { session },
      );
      if (taskUpdate.matchedCount !== 1)
        throw new AppError(
          409,
          "Task changed while approving submission.",
          "CONFLICT",
        );
      await createAuditEntry(
        req,
        "TASK_MANGAKA_APPROVED",
        "task",
        submission.taskId,
        { submissionId },
        session,
      );
      await recordTaskEarning(task, submission, session);
      await applyApprovedSubmissionToPage(updated ?? submission, task, session);
    } else if (status === "REVISION_REQUESTED") {
      await StudioTaskModel.updateOne(
        { id: submission.taskId, currentSubmissionId: submission.id },
        { $set: { status: "REVISION_REQUESTED", updatedAt: nowIso() } },
        { session },
      );
    } else if (status === "REJECTED") {
      await StudioTaskModel.updateOne(
        { id: submission.taskId, currentSubmissionId: submission.id },
        {
          $set: {
            status: "REJECTED",
            updatedAt: nowIso(),
          },
        },
        { session },
      );
    }
    await createAuditEntry(
      req,
      `submission.${action}`,
      "submission",
      submissionId,
      { status },
      session,
    );
    await createOutboxEvent(
      `submission.${action}`,
      "submission",
      submissionId,
      { taskId: task.id, status },
      session,
    );
    return updated;
  });
}

export async function taskDetail(req: AuthedRequest, taskId: string) {
  const actor = ensureActor(req);
  const task = await StudioTaskModel.findOne({ id: taskId }).lean();
  if (!task) throw new AppError(404, "Task not found.", "TASK_NOT_FOUND");
  await assertCanReadTask(actor, task);
  return task;
}
