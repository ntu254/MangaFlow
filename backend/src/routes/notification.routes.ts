import { Router } from "express";
import {
  listNotifications,
  markRead,
  listRankings,
  listSeriesRankings,
  importRankings
} from "../controllers/notification.controller.js";
import { requireExactRole, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/notifications", listNotifications);
router.post("/notifications/:id/read", markRead);

// Rankings (originally registered inside registerNotifications)
router.get("/rankings", requireExactRole("BOARD", "EDITOR", "MANGAKA") as any, listRankings);
router.post("/rankings/import", requireRole("BOARD") as any, importRankings);
router.get(
  "/series/:seriesId/rankings",
  requireExactRole("BOARD", "EDITOR", "MANGAKA") as any,
  listSeriesRankings,
);

export default router;
