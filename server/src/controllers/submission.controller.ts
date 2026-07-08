import { asyncRoute, created, ok, AppError } from "../lib/http.js";
import { ChapterModel, SeriesModel, StudioTaskModel, SubmissionModel } from "../db/models.js";
import { filterFromQuery, paginated, requireActor } from "./helpers.js";
import { submissionDecision } from "../services/workflow.service.js";
import { parseBody, rejectProtectedFields } from "../validators/common.js";
import { createSubmissionSchema, submissionActionSchema } from "../validators/submission.schema.js";
import { id, nowIso } from "../domain/ids.js";
import { audit } from "../services/audit.service.js";
import type { AuthedRequest } from "../types.js";

export const listSubmissions = asyncRoute(async (req: AuthedRequest, res) => {
  const filter = filterFromQuery(req);
  const actor = req.actor;
  if (actor?.role === "ASSISTANT") {
    // Assistants only ever see their own submissions.
    filter.assistantId = actor.id;
  } else if (actor?.role === "MANGAKA" || actor?.role === "EDITOR") {
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
  }
  // ADMIN/BOARD remain unscoped.
  await paginated(req, res, SubmissionModel, filter, { submittedAt: -1 });
});
export const createSubmission = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const body = parseBody(createSubmissionSchema, req);
  const { status, version: _version, ...clientFields } = body;
  rejectProtectedFields(clientFields as Record<string, unknown>);

  if (!body.taskId) throw new AppError(400, "taskId is required.", "VALIDATION_ERROR");

  const task = await StudioTaskModel.findOne({ id: body.taskId }).lean();
  if (!task) throw new AppError(404, "Task not found.", "TASK_NOT_FOUND");
  if (actor.role === "ASSISTANT" && (task as any).assigneeId !== actor.id) {
    throw new AppError(403, "Task is not assigned to the current assistant.", "TASK_NOT_ASSIGNED");
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
  const isSubmitted = body.intent === "SUBMIT";
  const timestamp = nowIso();
  const submission = await SubmissionModel.create({
    id: id("sub"),
    ...clientFields,
    taskId: body.taskId,
    seriesId: clientFields.seriesId ?? (task as any).seriesId,
    chapterId: clientFields.chapterId ?? (task as any).chapterId,
    pageId: clientFields.pageId ?? (task as any).pageId,
    regionId: clientFields.regionId ?? (task as any).regionId,
    assistantId: actor.id,
    assistantName: actor.name,
    submittedBy: { id: actor.id, name: actor.name, role: actor.role },
    submittedAt: isSubmitted ? timestamp : undefined,
    version,
    versionLabel: `v${version}`,
    // PENDING = submitted for review; use intent DRAFT for pre-submission saves
    status: isSubmitted ? "PENDING" : "PENDING",
    reviewStage: "MANGAKA_REVIEW",
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
      status: isSubmitted ? "PENDING" : "PENDING",
      version,
    },
  );
  created(res, submission);
});
export const reviewQueue = asyncRoute(async (req: AuthedRequest, res) => {
  const chapters = await ChapterModel.find({ status: "EDITOR_REVIEW" }).select({ id: 1 }).lean();
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
  if (req.actor?.role === "ASSISTANT" && (submission as any).assistantId !== req.actor.id) {
    throw new AppError(403, "Submission is not owned by the current assistant.", "FORBIDDEN");
  }
  ok(res, submission);
});

export const listTaskSubmissions = asyncRoute(async (req: AuthedRequest, res) => {
  const task = await StudioTaskModel.findOne({ id: String(req.params.taskId) }).lean();
  if (!task) throw new AppError(404, "Task not found.", "TASK_NOT_FOUND");
  if (req.actor?.role === "ASSISTANT" && (task as any).assigneeId !== req.actor.id) {
    throw new AppError(403, "Task is not assigned to the current assistant.", "TASK_NOT_ASSIGNED");
  }
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
