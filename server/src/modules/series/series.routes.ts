import { Router } from "express"
import { z } from "zod"
import { requireAuth } from "../../shared/middleware/requireAuth.js"
import { requireRole } from "../../shared/middleware/requireRole.js"
import { validate } from "../../shared/middleware/validate.js"
import { asyncHandler } from "../../shared/middleware/asyncHandler.js"
import * as controller from "./series.controller.js"
import { createManuscriptUploadSchema, createSeriesSchema, seriesIdParamsSchema, updateSeriesSchema } from "./series.validation.js"
import { addSeriesMemberSchema, updateSeriesMemberSchema } from "./series-member.validation.js"
import {
  addSeriesMember,
  listSeriesMembers,
  updateSeriesMember,
  removeSeriesMember,
  getEligibleAssistants,
} from "./series-member.controller.js"

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
  "/:seriesId/submit-to-editor",
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
  asyncHandler(addSeriesMember),
)

router.get(
  "/:seriesId/members",
  requireAuth,
  validate(seriesIdParamsSchema, "params"),
  asyncHandler(listSeriesMembers),
)

router.patch(
  "/:seriesId/members/:memberId",
  requireAuth,
  requireRole("MANGAKA", "EDITOR"),
  validate(updateSeriesMemberSchema),
  asyncHandler(updateSeriesMember),
)

router.delete(
  "/:seriesId/members/:memberId",
  requireAuth,
  requireRole("MANGAKA", "EDITOR"),
  validate(z.object({ seriesId: z.string().min(1), memberId: z.string().min(1) }), "params"),
  asyncHandler(removeSeriesMember),
)

router.get(
  "/:seriesId/eligible-assistants",
  requireAuth,
  requireRole("MANGAKA", "EDITOR", "ADMIN"),
  validate(seriesIdParamsSchema, "params"),
  asyncHandler(getEligibleAssistants),
)

export default router
