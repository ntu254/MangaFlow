import { Router } from "express";
import { requireRole, requireBoardChair } from "../middleware/auth.js";
import {
  editorReviewQueueHandler,
  boardQueueHandler,
  getBoardVotes,
  startReview,
  requestRevision,
  rejectSeries,
  forwardToBoard,
  castVote,
  finalizeDecision,
  tieBreakDecision,
  atRiskDecision
} from "../controllers/mobile.controller.js";

const router = Router();

// Editor mobile aliases
router.get("/editor/manuscripts/review-queue", editorReviewQueueHandler);
router.post("/editor/series/:seriesId/start-review", requireRole("EDITOR") as any, startReview);
router.post("/editor/series/:seriesId/request-revision", requireRole("EDITOR") as any, requestRevision);
router.post("/editor/series/:seriesId/reject", requireRole("EDITOR") as any, rejectSeries);
router.post("/editor/series/:seriesId/forward-to-board", requireRole("EDITOR") as any, forwardToBoard);

// Board mobile aliases
router.get("/board/queue", boardQueueHandler);
router.get("/board/series/:seriesId/votes", getBoardVotes);
router.post("/board/series/:seriesId/votes", requireRole("BOARD") as any, castVote);
router.post("/board/series/:seriesId/decisions/finalize", requireRole("BOARD") as any, finalizeDecision);
router.post("/board/series/:seriesId/decisions/tie-break", requireRole("EDITOR") as any, tieBreakDecision);
router.post("/board/series/:seriesId/at-risk-decisions", requireBoardChair as any, atRiskDecision);

export default router;
