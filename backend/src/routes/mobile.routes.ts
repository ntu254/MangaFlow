import { Router } from "express";
import { requireExactBoardChair, requireExactRole } from "../middleware/auth.js";
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
router.get("/editor/manuscripts/review-queue", requireExactRole("EDITOR") as any, editorReviewQueueHandler);
router.post("/editor/series/:seriesId/start-review", requireExactRole("EDITOR") as any, startReview);
router.post("/editor/series/:seriesId/request-revision", requireExactRole("EDITOR") as any, requestRevision);
router.post("/editor/series/:seriesId/reject", requireExactRole("EDITOR") as any, rejectSeries);
router.post("/editor/series/:seriesId/forward-to-board", requireExactRole("EDITOR") as any, forwardToBoard);

// Board mobile aliases
router.get("/board/queue", requireExactRole("BOARD", "EDITOR") as any, boardQueueHandler);
router.get("/board/series/:seriesId/votes", requireExactRole("BOARD", "EDITOR") as any, getBoardVotes);
router.post("/board/series/:seriesId/votes", requireExactRole("BOARD") as any, castVote);
router.post("/board/series/:seriesId/decisions/finalize", requireExactBoardChair as any, finalizeDecision);
router.post("/board/series/:seriesId/decisions/tie-break", requireExactRole("EDITOR") as any, tieBreakDecision);
router.post("/board/series/:seriesId/at-risk-decisions", requireExactBoardChair as any, atRiskDecision);

export default router;
