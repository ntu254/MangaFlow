import { Router } from "express"
import { validate } from "../../shared/middleware/validate.js"
import { asyncHandler } from "../../shared/middleware/asyncHandler.js"
import * as controller from "./public.controller.js"
import { chapterSlugParamsSchema, readerMetricsBodySchema, seriesSlugParamsSchema } from "./public.validation.js"
import { chapterIdParamsSchema } from "../chapter/chapter.validation.js"

const router = Router()

// Public Reader APIs
router.get("/series/:seriesSlug", validate(seriesSlugParamsSchema, "params"), asyncHandler(controller.getPublicSeries))
router.get("/chapters/:chapterSlug", validate(chapterSlugParamsSchema, "params"), asyncHandler(controller.getPublicChapter))
router.get("/chapters/:chapterId/pages", validate(chapterIdParamsSchema, "params"), asyncHandler(controller.getPublicChapterPages))
router.post("/reader-metrics", validate(readerMetricsBodySchema), asyncHandler(controller.recordReaderMetrics))

export default router
