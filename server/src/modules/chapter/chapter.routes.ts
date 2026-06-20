import { asyncHandler } from "../../shared/middleware/asyncHandler.js"
import { Router } from "express"
import { requireAuth } from "../../shared/middleware/requireAuth.js"
import { requireRole } from "../../shared/middleware/requireRole.js"
import { requireSeriesRole } from "../../shared/middleware/requireSeriesRole.js"
import { requireChapterRole } from "../../shared/middleware/requireChapterRole.js"
import { validate } from "../../shared/middleware/validate.js"
import * as controller from "./chapter.controller.js"
import {
  createChapterSchema,
  chapterIdParamsSchema,
  updateChapterStatusSchema,
  createPageSchema,
  listPagesParamsSchema,
} from "./chapter.validation.js"

const router = Router()

// Create needs seriesId in body — requireSeriesRole picks it up from req.body.seriesId.
router.post(
  "/",
  requireAuth,
  validate(createChapterSchema),
  requireSeriesRole("MANGAKA", "EDITOR"),
  controller.createChapter,
)

router.get(
  "/series/:seriesId",
  requireAuth,
  controller.listChapters,
)

router.get(
  "/:chapterId",
  requireAuth,
  validate(chapterIdParamsSchema, "params"),
  controller.getChapter,
)

router.get(
  "/:chapterId/readiness",
  requireAuth,
  requireRole("ADMIN", "MANGAKA", "EDITOR"),
  validate(chapterIdParamsSchema, "params"),
  controller.getChapterReadiness,
)

router.post(
  "/:chapterId/mark-ready",
  requireAuth,
  requireChapterRole("EDITOR"),
  validate(chapterIdParamsSchema, "params"),
  controller.markChapterReady,
)

// Chapter-scoped writes must be limited to MANGAKA/EDITOR of the chapter's series, not
// global roles. requireChapterRole resolves seriesId from chapterId then delegates.
router.patch(
  "/:chapterId/status",
  requireAuth,
  validate(updateChapterStatusSchema),
  requireChapterRole("MANGAKA", "EDITOR"),
  controller.updateChapterStatus,
)

router.post(
  "/:chapterId/pages",
  requireAuth,
  validate(createPageSchema),
  requireChapterRole("MANGAKA", "EDITOR"),
  controller.createPage,
)

router.get(
  "/:chapterId/pages",
  requireAuth,
  validate(listPagesParamsSchema, "params"),
  controller.listPages,
)


router.delete(
  "/:chapterId",
  requireAuth,
  requireChapterRole("MANGAKA", "EDITOR"),
  validate(chapterIdParamsSchema, "params"),
  asyncHandler(controller.deleteChapter),
)

router.post(
  "/:chapterId/cancel",
  requireAuth,
  requireChapterRole("MANGAKA", "EDITOR"),
  validate(chapterIdParamsSchema, "params"),
  asyncHandler(controller.cancelChapter),
)

router.delete(
  "/:chapterId/pages/:pageId",
  requireAuth,
  requireChapterRole("MANGAKA", "EDITOR"),
  // Note: we can add validation for pageId as well
  asyncHandler(controller.deletePage),
)

router.put(
  "/:chapterId/pages/:pageId/replace",
  requireAuth,
  requireChapterRole("MANGAKA", "EDITOR"),
  asyncHandler(controller.replacePage),
)

export default router