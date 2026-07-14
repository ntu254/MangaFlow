import { Router } from "express";
import { requireRole } from "../middleware/auth.js";
import { atRiskDecision } from "../modules/at-risk/presentation/at-risk.controller.js";

const router = Router();

router.post("/board/series/:seriesId/at-risk-decisions", requireRole("BOARD") as any, atRiskDecision);

export default router;
