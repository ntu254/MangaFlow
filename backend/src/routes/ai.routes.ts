import { Router } from "express";
import multer from "multer";
import { requireRole } from "../middleware/auth.js";
import { createAiHandlers } from "../controllers/ai.controller.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

export function createAiRoutes(aiServiceUrl: string) {
  const router = Router();
  const { health, detectBubbles, processBubbles, detectPageBubbles, whitenPageBubbles } =
    createAiHandlers(aiServiceUrl);

  router.get("/ai/health", health);
  router.post("/ai/bubbles/detect", requireRole("EDITOR", "MANGAKA"), upload.single("file"), detectBubbles);
  router.post("/ai/bubbles/process", requireRole("EDITOR", "MANGAKA"), upload.single("file"), processBubbles);
  router.post("/studio/pages/:pageId/ai/detect-bubbles", requireRole("EDITOR", "MANGAKA"), detectPageBubbles);
  router.post("/studio/pages/:pageId/ai/whiten-bubbles", requireRole("EDITOR", "MANGAKA"), whitenPageBubbles);

  return router;
}
