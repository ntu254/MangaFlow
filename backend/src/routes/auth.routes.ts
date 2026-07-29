import { Router } from "express";
import {
  loginHandler,
  refreshHandler,
  meHandler,
  logoutHandler,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { authRateLimit } from "../middleware/rate-limit.js";

const router = Router();

router.post("/auth/login", authRateLimit, loginHandler);
router.post("/auth/refresh", authRateLimit, refreshHandler);
router.get("/auth/me", requireAuth as any, meHandler);
router.post("/auth/logout", requireAuth as any, logoutHandler);

export default router;
