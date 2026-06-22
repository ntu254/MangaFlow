import { Router } from "express"
import { requireAuth } from "../../shared/middleware/requireAuth.js"
import { requireRole } from "../../shared/middleware/requireRole.js"
import { validate } from "../../shared/middleware/validate.js"
import * as controller from "./board.controller.js"
import { atRiskDecisionBodySchema, boardFinalizeBodySchema, boardScheduleBodySchema, boardTieBreakBodySchema, boardVoteBodySchema, seriesIdParamsSchema } from "./board.validation.js"

const router = Router()

router.get("/queue", requireAuth, requireRole("BOARD"), controller.listQueue)
router.get("/publishing-schedule", requireAuth, requireRole("BOARD"), controller.listPublishingSchedule)
router.get("/cancellation-cases", requireAuth, requireRole("BOARD"), controller.listCancellationCases)
router.get("/decision-history", requireAuth, requireRole("BOARD"), controller.listDecisionHistory)
router.post("/series/:seriesId/votes", requireAuth, requireRole("BOARD"), validate(seriesIdParamsSchema, "params"), validate(boardVoteBodySchema), controller.castVote)
router.post("/series/:seriesId/vote", requireAuth, requireRole("BOARD"), validate(seriesIdParamsSchema, "params"), validate(boardVoteBodySchema), controller.castVote)
router.post("/series/:seriesId/decisions/finalize", requireAuth, requireRole("BOARD"), validate(seriesIdParamsSchema, "params"), validate(boardFinalizeBodySchema), controller.finalizeDecision)
router.post("/series/:seriesId/finalize-decision", requireAuth, requireRole("BOARD"), validate(seriesIdParamsSchema, "params"), validate(boardFinalizeBodySchema), controller.finalizeDecision)
router.post("/series/:seriesId/decisions/tie-break", requireAuth, requireRole("BOARD"), validate(seriesIdParamsSchema, "params"), validate(boardTieBreakBodySchema), controller.tieBreakDecision)
router.post("/series/:seriesId/tie-break", requireAuth, requireRole("BOARD"), validate(seriesIdParamsSchema, "params"), validate(boardTieBreakBodySchema), controller.tieBreakDecision)
router.post("/series/:seriesId/publishing-schedule", requireAuth, requireRole("BOARD"), validate(seriesIdParamsSchema, "params"), validate(boardScheduleBodySchema), controller.savePublishingSchedule)
router.get("/series/:seriesId/at-risk-decisions", requireAuth, requireRole("BOARD"), validate(seriesIdParamsSchema, "params"), controller.listAtRiskDecisions)
router.post("/series/:seriesId/at-risk-decisions", requireAuth, requireRole("BOARD"), validate(seriesIdParamsSchema, "params"), validate(atRiskDecisionBodySchema), controller.createAtRiskDecision)

export default router
