import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getSeriesEditor } from "../controllers/tantou.controller.js";

const router = Router();

router.get("/series/:seriesId/editor", requireAuth as any, getSeriesEditor);

export default router;
