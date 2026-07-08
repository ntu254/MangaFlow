import { Router } from "express";
import { requireRole } from "../middleware/auth.js";
import {
  listVotingSessions,
  decisionHistory,
  getVotingSession,
  createVotingSession,
  patchVotingSession,
  closeSession,
  cancelSession,
  tieBreak,
  addSessionNote,
  patchSessionNote,
  deleteSessionNote,
} from "../controllers/voting.controller.js";

const router = Router();

router.get("/board/decisions/history", requireRole("BOARD", "EDITOR") as any, decisionHistory);
router.get("/voting-sessions", requireRole("BOARD", "EDITOR") as any, listVotingSessions);
router.get("/voting-sessions/:id", requireRole("BOARD", "EDITOR") as any, getVotingSession);
router.post("/voting-sessions", requireRole("EDITOR", "BOARD") as any, createVotingSession);
router.patch("/voting-sessions/:id", requireRole("EDITOR", "BOARD") as any, patchVotingSession);
router.post("/voting-sessions/:id/close", requireRole("EDITOR", "BOARD") as any, closeSession);
router.post("/voting-sessions/:id/cancel", requireRole("EDITOR", "BOARD") as any, cancelSession);
router.post("/voting-sessions/:id/tie-break", requireRole("EDITOR") as any, tieBreak);
router.post(
  "/voting-sessions/:id/notes",
  requireRole("EDITOR", "BOARD") as any,
  addSessionNote,
);
router.patch(
  "/voting-sessions/:id/notes/:noteId",
  requireRole("EDITOR", "BOARD") as any,
  patchSessionNote,
);
router.delete(
  "/voting-sessions/:id/notes/:noteId",
  requireRole("EDITOR", "BOARD") as any,
  deleteSessionNote,
);

export default router;
