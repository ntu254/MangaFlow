import { Router } from "express";
import { requireRole } from "../middleware/auth.js";
import {
  postponePublication,
  publishPublication,
  schedulePublication,
} from "../modules/publications/presentation/publication.controller.js";

const router = Router();

router.post(
  "/chapters/:chapterId/publication/schedule",
  requireRole("EDITOR") as any,
  schedulePublication,
);
router.post(
  "/chapters/:chapterId/publication/postpone",
  requireRole("EDITOR") as any,
  postponePublication,
);
router.post(
  "/chapters/:chapterId/publication/publish",
  requireRole("EDITOR") as any,
  publishPublication,
);

export default router;
