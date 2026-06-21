import { Router } from "express"
import { requireAuth } from "../../shared/middleware/requireAuth.js"
import { validate } from "../../shared/middleware/validate.js"
import { asyncHandler } from "../../shared/middleware/asyncHandler.js"
import * as controller from "./submission.controller.js"
import {
  createSubmissionBodySchema,
  reviewActionBodySchema,
  submissionIdParamsSchema,
  taskIdParamsSchema,
  getTaskUploadUrlBodySchema,
} from "./submission.validation.js"

const router = Router()

router.post(
  "/tasks/:taskId/submissions",
  requireAuth,
  validate(taskIdParamsSchema, "params"),
  validate(createSubmissionBodySchema),
  asyncHandler(controller.createTaskSubmission),
)

router.post(
  "/tasks/:taskId/submissions/upload-url",
  requireAuth,
  validate(taskIdParamsSchema, "params"),
  validate(getTaskUploadUrlBodySchema),
  asyncHandler(controller.getTaskUploadUrl),
)

router.get(
  "/tasks/:taskId/submissions",
  requireAuth,
  validate(taskIdParamsSchema, "params"),
  asyncHandler(controller.listTaskSubmissions),
)

router.get(
  "/submissions/review-queue",
  requireAuth,
  asyncHandler(controller.listReviewQueueSubmissions),
)

router.get(
  "/submissions",
  requireAuth,
  asyncHandler(controller.listAllSubmissions),
)

router.post(
  "/submissions/:submissionId/mangaka-approve",
  requireAuth,
  validate(submissionIdParamsSchema, "params"),
  validate(reviewActionBodySchema),
  asyncHandler(controller.mangakaApproveSubmission),
)

router.post(
  "/submissions/:submissionId/request-revision",
  requireAuth,
  validate(submissionIdParamsSchema, "params"),
  validate(reviewActionBodySchema),
  asyncHandler(controller.requestSubmissionRevision),
)

router.post(
  "/submissions/:submissionId/reject",
  requireAuth,
  validate(submissionIdParamsSchema, "params"),
  validate(reviewActionBodySchema),
  asyncHandler(controller.rejectSubmission),
)

router.post(
  "/submissions/:submissionId/editor-approve",
  requireAuth,
  validate(submissionIdParamsSchema, "params"),
  validate(reviewActionBodySchema),
  asyncHandler(controller.editorApproveSubmission),
)

/** Flow-07: Editor reject from MANGAKA_APPROVED state — requires reviewerNote. */
router.post(
  "/submissions/:submissionId/editor-reject",
  requireAuth,
  validate(submissionIdParamsSchema, "params"),
  validate(reviewActionBodySchema),
  asyncHandler(controller.editorRejectSubmission),
)

export default router
