import { Router } from "express"
import { asyncHandler } from "../../shared/middleware/asyncHandler.js"
import { requireAuth } from "../../shared/middleware/requireAuth.js"
import { requireRole } from "../../shared/middleware/requireRole.js"
import { validate } from "../../shared/middleware/validate.js"
import * as controller from "./chapter-review.controller.js"
import {
  annotationIdParamsSchema,
  chapterIdParamsSchema,
  createAnnotationBodySchema,
  patchAnnotationBodySchema,
  reviewDecisionBodySchema,
  versionIdParamsSchema,
} from "./chapter-review.validation.js"

const router = Router()

router.get(
  "/editor/chapter-review-queue",
  requireAuth,
  requireRole("EDITOR", "ADMIN"),
  asyncHandler(controller.listEditorChapterReviewQueue),
)

router.post(
  "/editor/chapter-review-versions/:versionId/request-revision",
  requireAuth,
  requireRole("EDITOR"),
  validate(versionIdParamsSchema, "params"),
  validate(reviewDecisionBodySchema),
  asyncHandler(controller.requestChapterVersionRevision),
)

router.post(
  "/editor/chapter-review-versions/:versionId/approve",
  requireAuth,
  requireRole("EDITOR"),
  validate(versionIdParamsSchema, "params"),
  validate(reviewDecisionBodySchema),
  asyncHandler(controller.approveChapterVersion),
)

router.post(
  "/chapters/:chapterId/review-versions",
  requireAuth,
  requireRole("MANGAKA"),
  validate(chapterIdParamsSchema, "params"),
  asyncHandler(controller.submitChapterVersion),
)

router.get(
  "/chapters/:chapterId/review-versions",
  requireAuth,
  requireRole("MANGAKA", "EDITOR", "ADMIN"),
  validate(chapterIdParamsSchema, "params"),
  asyncHandler(controller.listChapterVersions),
)

router.get(
  "/chapter-review-versions/:versionId",
  requireAuth,
  requireRole("MANGAKA", "EDITOR", "ADMIN"),
  validate(versionIdParamsSchema, "params"),
  asyncHandler(controller.getChapterVersionDetail),
)

router.get(
  "/chapter-review-versions/:versionId/annotations",
  requireAuth,
  requireRole("MANGAKA", "EDITOR", "ADMIN"),
  validate(versionIdParamsSchema, "params"),
  asyncHandler(controller.listChapterReviewAnnotations),
)

router.post(
  "/chapter-review-versions/:versionId/annotations",
  requireAuth,
  requireRole("EDITOR"),
  validate(versionIdParamsSchema, "params"),
  validate(createAnnotationBodySchema),
  asyncHandler(controller.createChapterReviewAnnotation),
)

router.patch(
  "/chapter-review-annotations/:annotationId",
  requireAuth,
  requireRole("EDITOR"),
  validate(annotationIdParamsSchema, "params"),
  validate(patchAnnotationBodySchema),
  asyncHandler(controller.patchChapterReviewAnnotation),
)

export default router
