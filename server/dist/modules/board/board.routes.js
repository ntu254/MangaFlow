import { Router } from "express";
import { requireAuth } from "../../shared/middleware/requireAuth.js";
import { requireRole } from "../../shared/middleware/requireRole.js";
import { validate } from "../../shared/middleware/validate.js";
import * as controller from "./board.controller.js";
import { atRiskDecisionBodySchema, boardVoteBodySchema, seriesIdParamsSchema } from "./board.validation.js";
const router = Router();
router.get("/queue", requireAuth, requireRole("BOARD"), controller.listQueue);
router.post("/series/:seriesId/votes", requireAuth, requireRole("BOARD"), validate(seriesIdParamsSchema, "params"), validate(boardVoteBodySchema), controller.castVote);
router.post("/series/:seriesId/decisions/finalize", requireAuth, requireRole("BOARD"), validate(seriesIdParamsSchema, "params"), controller.finalizeDecision);
router.post("/series/:seriesId/decisions/tie-break", requireAuth, requireRole("BOARD"), validate(seriesIdParamsSchema, "params"), validate(boardVoteBodySchema), controller.tieBreakDecision);
router.post("/series/:seriesId/at-risk-decisions", requireAuth, requireRole("BOARD"), validate(seriesIdParamsSchema, "params"), validate(atRiskDecisionBodySchema), controller.createAtRiskDecision);
export default router;
//# sourceMappingURL=board.routes.js.map