import { asyncRoute, created, ok } from "../../../lib/http.js";
import { paginated } from "../../../controllers/helpers.js";
import { parseBody } from "../../../validators/common.js";
import { createSubmissionSchema, submissionActionSchema } from "../../../validators/submission.schema.js";
import type { AuthedRequest } from "../../../types.js";
import {
  createSubmission as createSubmissionCommand,
  decideSubmission,
  editorReviewQueueFilter,
  getSubmission as getSubmissionQuery,
  listTaskSubmissions as listTaskSubmissionsQuery,
  submissionListFilter,
  submissionModel,
} from "../application/submission.service.js";

export const listSubmissions = asyncRoute(async (req: AuthedRequest, res) => {
  await paginated(req, res, submissionModel(), await submissionListFilter(req), { submittedAt: -1 });
});

export const createSubmission = asyncRoute(async (req: AuthedRequest, res) => {
  const body = parseBody(createSubmissionSchema, req);
  created(res, await createSubmissionCommand(req, body));
});

export const reviewQueue = asyncRoute(async (req: AuthedRequest, res) => {
  return paginated(req, res, submissionModel(), await editorReviewQueueFilter(req), { submittedAt: -1 });
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
