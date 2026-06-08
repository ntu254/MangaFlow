import { Router } from "express"
import { requireAuth } from "../../shared/middleware/requireAuth.js"
import { requireRole } from "../../shared/middleware/requireRole.js"
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

router.post(
  "/",
  requireAuth,
  requireRole("MANGAKA", "EDITOR"),
  validate(createChapterSchema),
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

router.patch(
  "/:chapterId/status",
  requireAuth,
  requireRole("MANGAKA", "EDITOR"),
  validate(updateChapterStatusSchema),
  controller.updateChapterStatus,
)

router.post(
  "/:chapterId/pages",
  requireAuth,
  requireRole("MANGAKA", "EDITOR"),
  validate(createPageSchema),
  controller.createPage,
)

router.get(
  "/:chapterId/pages",
  requireAuth,
  validate(listPagesParamsSchema, "params"),
  controller.listPages,
)

export default router