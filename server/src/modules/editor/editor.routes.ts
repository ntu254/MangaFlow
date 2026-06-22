import { Router } from "express"
import { requireAuth } from "../../shared/middleware/requireAuth.js"
import { requireRole } from "../../shared/middleware/requireRole.js"
import { validate } from "../../shared/middleware/validate.js"
import { asyncHandler } from "../../shared/middleware/asyncHandler.js"
import * as controller from "./editor.controller.js"
import { editorForwardBodySchema, editorRejectBodySchema, editorRevisionBodySchema, editorSeriesIdParamsSchema } from "./editor.validation.js"

const router = Router()

router.get("/managed-series", requireAuth, requireRole("EDITOR", "ADMIN"), asyncHandler(controller.listManagedSeries))
router.get("/production-progress", requireAuth, requireRole("EDITOR", "ADMIN"), asyncHandler(controller.listProductionProgress))
router.get("/ranking-risk", requireAuth, requireRole("EDITOR", "ADMIN"), asyncHandler(controller.listRankingRisk))
router.get("/decision-history", requireAuth, requireRole("EDITOR", "ADMIN"), asyncHandler(controller.listDecisionHistory))
router.get("/activity", requireAuth, requireRole("EDITOR", "ADMIN"), asyncHandler(controller.listActivity))
router.get("/manuscripts/review-queue", requireAuth, requireRole("EDITOR"), asyncHandler(controller.listReviewQueue))
router.get("/series/:seriesId/review", requireAuth, requireRole("EDITOR"), validate(editorSeriesIdParamsSchema, "params"), asyncHandler(controller.getSeriesReview))
router.post("/series/:seriesId/start-review", requireAuth, requireRole("EDITOR"), validate(editorSeriesIdParamsSchema, "params"), asyncHandler(controller.startSeriesReview))
router.post("/series/:seriesId/request-revision", requireAuth, requireRole("EDITOR"), validate(editorSeriesIdParamsSchema, "params"), validate(editorRevisionBodySchema), asyncHandler(controller.requestRevision))
router.post("/series/:seriesId/reject", requireAuth, requireRole("EDITOR"), validate(editorSeriesIdParamsSchema, "params"), validate(editorRejectBodySchema), asyncHandler(controller.rejectSeries))
router.post("/series/:seriesId/forward-to-board", requireAuth, requireRole("EDITOR"), validate(editorSeriesIdParamsSchema, "params"), validate(editorForwardBodySchema), asyncHandler(controller.forwardToBoard))

export default router
