import { Router } from "express";
import { loginHandler, refreshHandler, meHandler, logoutHandler } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/auth/login", loginHandler);
router.post("/auth/refresh", refreshHandler);
router.get("/auth/me", requireAuth as any, meHandler);
router.post("/auth/logout", requireAuth as any, logoutHandler);

export default router;
