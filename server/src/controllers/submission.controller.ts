import { asyncRoute, created, ok, AppError } from "../lib/http.js";
import { ChapterModel, SeriesModel, StudioTaskModel, SubmissionModel } from "../db/models.js";
import { filterFromQuery, paginated, requireActor } from "./helpers.js";
import { submissionDecision } from "../services/workflow.service.js";
import { parseBody, rejectProtectedFields } from "../validators/common.js";
import { createSubmissionSchema, submissionActionSchema } from "../validators/submission.schema.js";
import { id, nowIso } from "../domain/ids.js";
import { audit } from "../services/audit.service.js";
import type { AuthedRequest } from "../types.js";
import {
  assertCanReadProductionSeries,
  assertCanReadTask,
} from "../services/mvp-access.service.js";

async function assertSeriesAccess(req: AuthedRequest, seriesId?: string) {
  const actor = requireActor(req);
  if (!seriesId) {
    throw new AppError(404, "Submission not found.", "SUBMISSION_NOT_FOUND");
  }

  await assertCanReadProductionSeries(actor, seriesId);
}

async function resolveSeriesId(record: { seriesId?: string; chapterId?: string }) {
  if (record.seriesId) return record.seriesId;
  if (!record.chapterId) return undefined;
  const chapter = await ChapterModel.findOne({ id: record.chapterId }).select({ seriesId: 1 }).lean();
  return (chapter as any)?.seriesId as string | undefined;
}

export const listSubmissions = asyncRoute(async (req: AuthedRequest, res) => {
  const filter = filterFromQuery(req);
  const actor = requireActor(req);
  if (actor.role === "ASSISTANT") {
    // Assistants only ever see their own submissions.
    filter.assistantId = actor.id;
  } else if (actor.role === "MANGAKA" || actor.role === "EDITOR") {
    // Mangaka/Editor only see submissions that belong to the series they own
    // (author for Mangaka, assigned editor for Editor). Scope by both seriesId
    // and chapterId so records persisted with either linkage are matched.
    const scope = actor.role === "MANGAKA" ? { authorId: actor.id } : { editorId: actor.id };
    const series = await SeriesModel.find(scope).select({ id: 1 }).lean();
    const seriesIds = series.map((item) => (item as any).id);
    const chapters = await ChapterModel.find({ seriesId: { $in: seriesIds } })
      .select({ id: 1 })
      .lean();
    const chapterIds = chapters.map((item) => (item as any).id);
    filter.$or = [{ seriesId: { $in: seriesIds } }, { chapterId: { $in: chapterIds } }];
  } else {
    filter.id = { $in: [] };
  }
  await paginated(req, res, SubmissionModel, filter, { submittedAt: -1 });
});
export const createSubmission = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  if (actor.role !== "ASSISTANT") {
    throw new AppError(403, "Only the assigned assistant can create a submission.", "FORBIDDEN");
  }
  const body = parseBody(createSubmissionSchema, req);
  const { status, version: _version, ...clientFields } = body;
  rejectProtectedFields(clientFields as Record<string, unknown>);

  if (!body.taskId) throw new AppError(400, "taskId is required.", "VALIDATION_ERROR");

  const task = await StudioTaskModel.findOne({ id: body.taskId }).lean();
  if (!task) throw new AppError(404, "Task not found.", "TASK_NOT_FOUND");
  if ((task as any).assigneeId !== actor.id) {
    throw new AppError(403, "Task is not assigned to the current assistant.", "TASK_NOT_ASSIGNED");
  }
  const taskChapter = (task as any).chapterId
    ? await ChapterModel.findOne({ id: (task as any).chapterId }).select({ seriesId: 1 }).lean()
    : undefined;
  const seriesId = (task as any).seriesId ?? (taskChapter as any)?.seriesId;
  if (!seriesId) {
    throw new AppError(409, "Task must belong to a series before submission.", "INVALID_TRANSITION");
  }

  const version =
    (await SubmissionModel.countDocuments({ taskId: body.taskId, assistantId: actor.id })) + 1;
  // Supersede the assistant's previous non-terminal submissions for this task so
  // only the newest one stays in the review queue (avoids stale image on resubmit).
  await SubmissionModel.updateMany(
    {
      taskId: body.taskId,
      assistantId: actor.id,
      status: { $in: ["PENDING", "MANGAKA_REVISION_REQUESTED", "EDITOR_REVISION_REQUESTED"] },
    },
    { $set: { status: "SUPERSEDED", updatedAt: nowIso() } },
  );
  // PENDING is the initial state when Assistant submits work for review
  const isSubmitted = body.intent !== "DRAFT";
  const timestamp = nowIso();
  const submission = await SubmissionModel.create({
    id: id("sub"),
    ...clientFields,
    taskId: body.taskId,
    seriesId,
    chapterId: (task as any).chapterId,
    pageId: (task as any).pageId,
    regionId: (task as any).regionId,
    assistantId: actor.id,
    assistantName: actor.name,
    submittedBy: { id: actor.id, name: actor.name, role: actor.role },
    submittedAt: isSubmitted ? timestamp : undefined,
    version,
    versionLabel: `v${version}`,
    status: isSubmitted ? "PENDING" : "DRAFT",
    reviewStage: isSubmitted ? "MANGAKA_REVIEW" : undefined,
    resultText: body.notes,
    fileKey: body.fileKey,
    fileName: body.fileName,
    fileUrl: body.fileUrl ?? body.imageUrl,
    imageUrl: body.imageUrl ?? body.fileUrl,
    fileSizeKB: body.fileSizeKB,
    mimeType: body.mimeType,
    metadata: body.metadata,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  await audit(
    req,
    isSubmitted ? "submission.create" : "submission.draft",
    "submission",
    (submission as any).id,
    {
      taskId: body.taskId,
      status: isSubmitted ? "PENDING" : "DRAFT",
      version,
    },
  );
  created(res, submission);
});
export const reviewQueue = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const series = await SeriesModel.find({ editorId: actor.id }).select({ id: 1 }).lean();
  const seriesIds = series.map((item: any) => item.id);
  const chapters = await ChapterModel.find({
    seriesId: { $in: seriesIds },
    status: "EDITOR_REVIEW",
  })
    .select({ id: 1 })
    .lean();
  const chapterIds = chapters.map((chapter: any) => chapter.id);
  return paginated(
    req,
    res,
    SubmissionModel,
    {
      chapterId: { $in: chapterIds },
      status: "MANGAKA_APPROVED",
      reviewStage: "EDITOR_REVIEW",
    },
    { submittedAt: -1 },
  );
});

export const getSubmission = asyncRoute(async (req: AuthedRequest, res) => {
  const submission = await SubmissionModel.findOne({ id: String(req.params.submissionId) }).lean();
  if (!submission) throw new AppError(404, "Submission not found.", "SUBMISSION_NOT_FOUND");
  const actor = requireActor(req);
  if (actor.role === "ASSISTANT" && (submission as any).assistantId !== actor.id) {
    throw new AppError(404, "Submission not found.", "SUBMISSION_NOT_FOUND");
  }
  if (actor.role !== "ASSISTANT") {
    await assertSeriesAccess(req, await resolveSeriesId(submission as any));
  }
  ok(res, submission);
});

export const listTaskSubmissions = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  await assertCanReadTask(actor, String(req.params.taskId));
  const submissions = await SubmissionModel.find({ taskId: String(req.params.taskId) })
    .sort({ submittedAt: -1 })
    .lean();
  ok(res, submissions);
});

export const approveSubmission = asyncRoute(async (req: AuthedRequest, res) => {
  const body = req.body ? parseBody(submissionActionSchema, req) : {};
  ok(
    res,
    await submissionDecision(
      req,
      String(req.params.submissionId),
      "approve",
      body.reviewerNote ?? req.body?.reviewerNote,
    ),
  );
});
export const rejectSubmission = asyncRoute(async (req: AuthedRequest, res) => {
  const body = req.body ? parseBody(submissionActionSchema, req) : {};
  ok(
    res,
    await submissionDecision(
      req,
      String(req.params.submissionId),
      "reject",
      body.reviewerNote ?? req.body?.reviewerNote,
    ),
  );
});
export const requestRevision = asyncRoute(async (req: AuthedRequest, res) => {
  const body = req.body ? parseBody(submissionActionSchema, req) : {};
  ok(
    res,
    await submissionDecision(
      req,
      String(req.params.submissionId),
      "request-revision",
      body.reviewerNote ?? req.body?.reviewerNote,
    ),
  );
});
export const editorApprove = asyncRoute(async (req: AuthedRequest, res) => {
  const body = req.body ? parseBody(submissionActionSchema, req) : {};
  ok(
    res,
    await submissionDecision(
      req,
      String(req.params.submissionId),
      "editor-approve",
      body.reviewerNote ?? req.body?.reviewerNote,
    ),
  );
});
