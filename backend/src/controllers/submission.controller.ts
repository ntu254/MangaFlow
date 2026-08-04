import { asyncRoute, created, ok, AppError } from "../lib/http.js";
import { ChapterModel, SeriesModel, StudioTaskModel, SubmissionModel } from "../db/models.js";
import { filterFromQuery, paginated } from "./helpers.js";
import {
  assertCanReadSubmission,
  assertCanReadTask,
  actorSeriesScopeFilter,
} from "../services/authorization.service.js";
import {
  reopenTaskForRevision,
  submissionDecision,
  submitTaskWork,
} from "../services/task-submission.service.js";
import { parseBody } from "../validators/common.js";
import { submissionActionSchema } from "../validators/submission.schema.js";
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
    const scope =
      actor.role === "MANGAKA" ? { authorId: actor.id } : await actorSeriesScopeFilter(actor, "read");
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
export const submitTask = asyncRoute(async (req: AuthedRequest, res) => {
  created(res, await submitTaskWork(req, String(req.params.taskId), req.body ?? {}));
});

export const reopenTask = asyncRoute(async (req: AuthedRequest, res) => {
  ok(res, await reopenTaskForRevision(req, String(req.params.taskId)));
});
export const reviewQueue = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = req.actor!;
  const series = await SeriesModel.find(await actorSeriesScopeFilter(actor, "read"))
    .select({ id: 1 })
    .lean();
  const chapters = await ChapterModel.find({
    seriesId: { $in: series.map((item: any) => item.id) },
    status: "TANTOU_REVIEW",
  }).select({ id: 1 }).lean();
  const chapterIds = chapters.map((chapter: any) => chapter.id);
  return paginated(
    req,
    res,
    SubmissionModel,
    {
      chapterId: { $in: chapterIds },
      status: "MANGAKA_APPROVED",
    },
    { submittedAt: -1 },
  );
});

export const getSubmission = asyncRoute(async (req: AuthedRequest, res) => {
  const submission = await SubmissionModel.findOne({ id: String(req.params.submissionId) }).lean();
  if (!submission) throw new AppError(404, "Submission not found.", "SUBMISSION_NOT_FOUND");
  await assertCanReadSubmission(req.actor!, submission);
  ok(res, submission);
});

export const listTaskSubmissions = asyncRoute(async (req: AuthedRequest, res) => {
  const task = await StudioTaskModel.findOne({ id: String(req.params.taskId) }).lean();
  if (!task) throw new AppError(404, "Task not found.", "TASK_NOT_FOUND");
  await assertCanReadTask(req.actor!, task);
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
