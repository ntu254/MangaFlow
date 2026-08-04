import { Router } from "express";
import {
  listNotifications,
  markRead,
} from "../controllers/notification.controller.js";
import {
  importRankingsController,
  listRankingPeriodFor,
  listRankingPeriods,
  getSeriesRankings,
} from "../controllers/ranking.controller.js";
import { listRankings } from "../controllers/notification.controller.js";
import { requireExactRole, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/notifications", listNotifications);
router.post("/notifications/:id/read", markRead);

// Sprint 3.1 / RANK-002 — ranking endpoints now live in
// ranking.controller.ts. The notification router keeps ownership of the
// URL prefix but delegates the handlers so notifications no longer
// double as the ranking import surface.
router.get("/rankings", requireExactRole("BOARD", "EDITOR", "MANGAKA") as any, listRankings);
router.get("/rankings/periods", requireRole("BOARD") as any, listRankingPeriods);
router.get("/rankings/periods/:period", requireRole("BOARD") as any, listRankingPeriodFor);
router.post("/rankings/import", requireRole("BOARD") as any, importRankingsController);
router.get(
  "/series/:seriesId/rankings",
  requireExactRole("BOARD", "EDITOR", "MANGAKA") as any,
  getSeriesRankings,
);

export default router;
