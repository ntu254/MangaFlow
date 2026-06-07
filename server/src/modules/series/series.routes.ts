import { Router } from "express"
import { requireAuth } from "../../shared/middleware/requireAuth.js"
import { requireRole } from "../../shared/middleware/requireRole.js"
import { validate } from "../../shared/middleware/validate.js"
import * as controller from "./series.controller.js"
import { createSeriesSchema, seriesIdParamsSchema } from "./series.validation.js"

const router = Router()

router.post("/", requireAuth, requireRole("MANGAKA"), validate(createSeriesSchema), controller.createSeries)
router.post(
  "/:seriesId/submit",
  requireAuth,
  requireRole("MANGAKA"),
  validate(seriesIdParamsSchema, "params"),
  controller.submitSeries,
)

export default router
