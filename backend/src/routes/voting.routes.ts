import { Router } from "express";
import { requireExactBoardChair, requireExactRole, requireRole } from "../middleware/auth.js";
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
router.post("/voting-sessions", requireExactBoardChair as any, createVotingSession);
router.patch("/voting-sessions/:id", requireExactBoardChair as any, patchVotingSession);
router.post("/voting-sessions/:id/close", requireExactBoardChair as any, closeSession);
router.post("/voting-sessions/:id/cancel", requireExactBoardChair as any, cancelSession);
router.post("/voting-sessions/:id/tie-break", requireExactRole("EDITOR") as any, tieBreak);
router.post(
  "/voting-sessions/:id/notes",
  requireExactRole("EDITOR", "BOARD") as any,
  addSessionNote,
);
router.patch(
  "/voting-sessions/:id/notes/:noteId",
  requireExactRole("EDITOR", "BOARD") as any,
  patchSessionNote,
);
router.delete(
  "/voting-sessions/:id/notes/:noteId",
  requireExactRole("EDITOR", "BOARD") as any,
  deleteSessionNote,
);

export default router;
