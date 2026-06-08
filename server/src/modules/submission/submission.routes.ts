import { Router } from "express"
import { requireAuth } from "../../shared/middleware/requireAuth.js"
import { validate } from "../../shared/middleware/validate.js"
import * as controller from "./submission.controller.js"
import {
  createSubmissionBodySchema,
  reviewActionBodySchema,
  submissionIdParamsSchema,
  taskIdParamsSchema,
} from "./submission.validation.js"

const router = Router()

router.post(
  "/tasks/:taskId/submissions",
  requireAuth,
  validate(taskIdParamsSchema, "params"),
  validate(createSubmissionBodySchema),
  controller.createTaskSubmission,
)

router.get(
  "/tasks/:taskId/submissions",
  requireAuth,
  validate(taskIdParamsSchema, "params"),
  controller.listTaskSubmissions,
)

router.post(
  "/submissions/:submissionId/mangaka-approve",
  requireAuth,
  validate(submissionIdParamsSchema, "params"),
  validate(reviewActionBodySchema),
  controller.mangakaApproveSubmission,
)

router.post(
  "/submissions/:submissionId/request-revision",
  requireAuth,
  validate(submissionIdParamsSchema, "params"),
  validate(reviewActionBodySchema),
  controller.requestSubmissionRevision,
)

router.post(
  "/submissions/:submissionId/reject",
  requireAuth,
  validate(submissionIdParamsSchema, "params"),
  validate(reviewActionBodySchema),
  controller.rejectSubmission,
)

router.post(
  "/submissions/:submissionId/editor-approve",
  requireAuth,
  validate(submissionIdParamsSchema, "params"),
  validate(reviewActionBodySchema),
  controller.editorApproveSubmission,
)

export default router
