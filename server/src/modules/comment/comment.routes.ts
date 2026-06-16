import { Router } from "express"
import { requireAuth } from "../../shared/middleware/requireAuth.js"
import { requirePermission } from "../../shared/policies/permissions.js"
import { validate } from "../../shared/middleware/validate.js"
import * as controller from "./comment.controller.js"
import { commentIdParamsSchema, createCommentSchema, taskIdParamsSchema } from "./comment.validation.js"

const router = Router()

// Flow-12: comments are scoped to the production team — Board is excluded at the role
// layer; entity-scope (same series) is still enforced by assertCommentSeriesMember.

router.post(
  "/",
  requireAuth,
  requirePermission("COMMENT_CREATE"),
  validate(createCommentSchema),
  controller.createComment,
)

router.get(
  "/task/:taskId",
  requireAuth,
  requirePermission("COMMENT_LIST"),
  validate(taskIdParamsSchema, "params"),
  controller.listTaskComments,
)

// Flow-06: Assistant marks the comment "fixed" after addressing feedback.
router.post(
  "/:id/mark-fixed",
  requireAuth,
  requirePermission("COMMENT_MARK_FIXED"),
  validate(commentIdParamsSchema, "params"),
  controller.markCommentFixed,
)

// Flow-06: Mangaka verifies the fix during review.
router.post(
  "/:id/verify-fixed",
  requireAuth,
  requirePermission("COMMENT_VERIFY_FIX"),
  validate(commentIdParamsSchema, "params"),
  controller.verifyCommentFixed,
)

// Flow-07: Editor resolves at final review.
router.post(
  "/:id/resolve",
  requireAuth,
  requirePermission("COMMENT_RESOLVE"),
  validate(commentIdParamsSchema, "params"),
  controller.resolveComment,
)

// Flow-07/06: Editor or Mangaka can reopen.
router.post(
  "/:id/reopen",
  requireAuth,
  requirePermission("COMMENT_REOPEN"),
  validate(commentIdParamsSchema, "params"),
  controller.reopenComment,
)

export default router
