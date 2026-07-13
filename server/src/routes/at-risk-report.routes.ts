import { Router } from "express";
import { requireRole } from "../middleware/auth.js";
import { createAtRiskReport, getLatestAtRiskReport } from "../controllers/at-risk-report.controller.js";

const router = Router();
router.post("/series/:seriesId/at-risk-reports", requireRole("EDITOR") as any, createAtRiskReport);
router.get("/series/:seriesId/at-risk-reports/latest", requireRole("BOARD", "EDITOR", "MANGAKA") as any, getLatestAtRiskReport);
export default router;
