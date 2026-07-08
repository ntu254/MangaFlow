import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  getSeriesEditor,
  assignSeriesEditor,
  removeSeriesEditor
} from "../controllers/tantou.controller.js";

const router = Router();

router.get("/series/:seriesId/editor", requireAuth as any, getSeriesEditor);
router.post("/series/:seriesId/editor", requireAuth as any, requireRole("MANGAKA") as any, assignSeriesEditor);
router.delete("/series/:seriesId/editor", requireAuth as any, requireRole("MANGAKA") as any, removeSeriesEditor);

export default router;
