import { Router } from "express";
import {
  getPublicChapter,
  getPublicSeries,
  listPublicSeries,
} from "../controllers/public.controller.js";

const router = Router();

router.get("/public/series", listPublicSeries);
router.get("/public/series/:slug", getPublicSeries);
router.get("/public/series/:slug/chapters/:chapterNumber", getPublicChapter);

export default router;
