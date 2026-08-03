import { Router } from "express";
import { listReviewFilesController } from "../controllers/review-file.controller.js";
import { requireExactRole } from "../middleware/auth.js";

const router = Router();

router.get(
  "/review-files/:context/:id",
  requireExactRole("BOARD", "EDITOR") as any,
  listReviewFilesController,
);

export default router;
