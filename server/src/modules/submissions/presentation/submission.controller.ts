import { asyncRoute, created, ok } from "../../../lib/http.js";
import { parseBody } from "../../../validators/common.js";
import { createSubmissionSchema, submissionActionSchema } from "../../../validators/submission.schema.js";
import type { AuthedRequest } from "../../../types.js";
import type { Response } from "express";
import {
  createSubmission as createSubmissionCommand,
  decideSubmission,
  editorReviewQueueFilter,
  getSubmission as getSubmissionQuery,
  listTaskSubmissions as listTaskSubmissionsQuery,
  submissionListFilter,
  submissionModel,
} from "../application/submission.service.js";
import {
  buildPagination,
  combineMongoFilters,
  listFiltersToMongo,
  listSearchToMongo,
  listSortToMongo,
  parseListQuery,
} from "../../../shared/contracts/list-contract.js";

const SUBMISSION_LIST_CONFIG = {
  searchable: ["taskId", "assistantName", "fileName", "resultText", "reviewerNote"] as const,
  sortable: ["submittedAt", "createdAt", "updatedAt", "status", "reviewStage", "version"] as const,
  filterable: {
    taskId: "select",
    seriesId: "select",
    chapterId: "select",
    assistantId: "select",
    status: "select",
    reviewStage: "select",
    submittedAt: "dateRange",
    createdAt: "dateRange",
    updatedAt: "dateRange",
    version: "numberRange",
  } as const,
  defaultSort: { field: "submittedAt", dir: "desc" } as const,
  maxPageSize: 100,
};

function summarizeSubmissions(submissions: any[]) {
  const byStatus = submissions.reduce<Record<string, number>>((acc, submission) => {
    const status = String(submission.status ?? "UNKNOWN");
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {});

  return {
    total: submissions.length,
    byStatus,
  };
}

async function sendSubmissionList(
  req: AuthedRequest,
  res: Response,
  baseFilter: Record<string, unknown>,
) {
  const query = parseListQuery(req, SUBMISSION_LIST_CONFIG);
  const filter = combineMongoFilters(
    baseFilter,
    listSearchToMongo(query.q, SUBMISSION_LIST_CONFIG.searchable),
    listFiltersToMongo(query.filters),
  );
  const sort = Object.keys(listSortToMongo(query.sort)).length
    ? listSortToMongo(query.sort)
    : { submittedAt: -1 as const };
  const [submissions, total] = await Promise.all([
    submissionModel()
      .find(filter)
      .sort(sort)
      .skip((query.page - 1) * query.pageSize)
      .limit(query.pageSize)
      .lean(),
    submissionModel().countDocuments(filter),
  ]);
  return res.status(200).json({
    success: true,
    data: submissions,
    pagination: buildPagination(query, total),
    meta: {
      q: query.q,
      sort: query.sort,
      filters: query.filters,
      summary: summarizeSubmissions(submissions),
    },
  });
}

export const listSubmissions = asyncRoute(async (req: AuthedRequest, res) => {
  await sendSubmissionList(req, res, await submissionListFilter(req));
});

export const createSubmission = asyncRoute(async (req: AuthedRequest, res) => {
  const body = parseBody(createSubmissionSchema, req);
  created(res, await createSubmissionCommand(req, body));
});

export const reviewQueue = asyncRoute(async (req: AuthedRequest, res) => {
  return sendSubmissionList(req, res, await editorReviewQueueFilter(req));
});

export const getSubmission = asyncRoute(async (req: AuthedRequest, res) => {
  ok(res, await getSubmissionQuery(req, String(req.params.submissionId)));
});

export const listTaskSubmissions = asyncRoute(async (req: AuthedRequest, res) => {
  ok(res, await listTaskSubmissionsQuery(req, String(req.params.taskId)));
});

function reviewerNoteFromRequest(req: AuthedRequest) {
  const body = req.body ? parseBody(submissionActionSchema, req) : {};
  return body.reviewerNote ?? req.body?.reviewerNote;
}

export const approveSubmission = asyncRoute(async (req: AuthedRequest, res) => {
  ok(res, await decideSubmission(req, String(req.params.submissionId), "approve", reviewerNoteFromRequest(req)));
});

export const rejectSubmission = asyncRoute(async (req: AuthedRequest, res) => {
  ok(res, await decideSubmission(req, String(req.params.submissionId), "reject", reviewerNoteFromRequest(req)));
});

export const requestRevision = asyncRoute(async (req: AuthedRequest, res) => {
  ok(
    res,
    await decideSubmission(req, String(req.params.submissionId), "request-revision", reviewerNoteFromRequest(req)),
  );
});

export const editorApprove = asyncRoute(async (req: AuthedRequest, res) => {
  ok(
    res,
    await decideSubmission(req, String(req.params.submissionId), "editor-approve", reviewerNoteFromRequest(req)),
  );
});
