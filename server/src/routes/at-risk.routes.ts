import { Router } from "express";
import { requireBoardChair } from "../middleware/auth.js";
import { atRiskDecision } from "../modules/at-risk/presentation/at-risk.controller.js";

const router = Router();

router.post("/board/series/:seriesId/at-risk-decisions", requireBoardChair as any, atRiskDecision);

export default router;
