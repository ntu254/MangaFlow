import { Router } from "express"
import { requireAuth } from "../../shared/middleware/requireAuth.js"
import { requireRole } from "../../shared/middleware/requireRole.js"
import { validate } from "../../shared/middleware/validate.js"
import { asyncHandler } from "../../shared/middleware/asyncHandler.js"
import * as controller from "./series.controller.js"
import { createManuscriptUploadSchema, createSeriesSchema, seriesIdParamsSchema, updateSeriesSchema } from "./series.validation.js"
import { addSeriesMemberSchema } from "./series-member.validation.js"
import { addSeriesMember } from "./series-member.controller.js"

const router = Router()

router.get("/", requireAuth, asyncHandler(controller.listSeries))
router.get("/:seriesId", requireAuth, validate(seriesIdParamsSchema, "params"), asyncHandler(controller.getSeriesDetail))
router.get("/:seriesId/summary", requireAuth, validate(seriesIdParamsSchema, "params"), asyncHandler(controller.getSeriesSummary))
router.post("/", requireAuth, requireRole("MANGAKA"), validate(createSeriesSchema), asyncHandler(controller.createSeries))

router.post(
  "/:seriesId/manuscripts/uploads",
  requireAuth,
  requireRole("MANGAKA"),
  validate(seriesIdParamsSchema, "params"),
  validate(createManuscriptUploadSchema),
  asyncHandler(controller.createManuscriptUpload),
)

router.patch(
  "/:seriesId",
  requireAuth,
  requireRole("MANGAKA"),
  validate(seriesIdParamsSchema, "params"),
  validate(updateSeriesSchema),
  asyncHandler(controller.updateSeries),
)
router.post(
  "/:seriesId/submit",
  requireAuth,
  requireRole("MANGAKA"),
  validate(seriesIdParamsSchema, "params"),
  asyncHandler(controller.submitSeries),
)

router.post(
  "/:seriesId/members",
  requireAuth,
  requireRole("MANGAKA", "EDITOR"),
  validate(seriesIdParamsSchema, "params"),
  validate(addSeriesMemberSchema),
  addSeriesMember,
)

export default router
