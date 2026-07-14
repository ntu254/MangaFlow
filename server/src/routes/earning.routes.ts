import { Router } from "express";
import { requireRole } from "../middleware/auth.js";
import { getMyEarnings } from "../modules/earnings/presentation/assistant-earnings.controller.js";

const router = Router();

router.get("/assistant/earnings", requireRole("ASSISTANT") as any, getMyEarnings);

export default router;
