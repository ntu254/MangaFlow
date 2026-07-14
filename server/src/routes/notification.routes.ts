import { Router } from "express";
import {
  listNotifications,
  markRead,
  archiveNotification,
} from "../controllers/notification.controller.js";
import {
  listRankings,
  listSeriesRankings,
  importRankings
} from "../modules/rankings/presentation/ranking.controller.js";
import { requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/notifications", listNotifications);
router.post("/notifications/:id/read", markRead);
router.post("/notifications/:id/archive", archiveNotification);

// Rankings (originally registered inside registerNotifications)
router.get("/rankings", listRankings);
router.post("/rankings/import", requireRole("BOARD", "ADMIN") as any, importRankings);
router.get("/series/:seriesId/rankings", listSeriesRankings);

export default router;
