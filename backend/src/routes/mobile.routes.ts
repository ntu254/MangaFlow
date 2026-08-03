import { Router } from "express";
import { requireExactBoardChair, requireExactRole } from "../middleware/auth.js";
import {
  editorReviewQueueHandler,
  boardQueueHandler,
  editorInboxHandler,
  editorActivityHandler,
  boardInboxHandler,
  editorProposalDetailHandler,
  editorChapterDetailHandler,
  boardSessionDetailHandler,
  boardRankingsHandler,
  getBoardVotes,
  startReview,
  releaseClaim,
  requestRevision,
  rejectSeries,
  forwardToBoard,
  castVote,
  finalizeDecision,
  atRiskDecision
} from "../controllers/mobile.controller.js";

const router = Router();

// Queue-first mobile inbox (foundation)
router.get("/editor/inbox", requireExactRole("EDITOR") as any, editorInboxHandler);
router.get("/editor/activity", requireExactRole("EDITOR") as any, editorActivityHandler);
router.get("/board/inbox", requireExactRole("BOARD") as any, boardInboxHandler);

// Editor detail projections
router.get(
  "/editor/proposals/:proposalId/detail",
  requireExactRole("EDITOR") as any,
  editorProposalDetailHandler,
);
router.get(
  "/editor/chapters/:chapterId/detail",
  requireExactRole("EDITOR") as any,
  editorChapterDetailHandler,
);

// Board detail projections (read-only)
router.get(
  "/board/sessions/:sessionId/detail",
  requireExactRole("BOARD") as any,
  boardSessionDetailHandler,
);
router.get("/board/rankings", requireExactRole("BOARD") as any, boardRankingsHandler);

// Editor mobile aliases
router.get("/editor/proposals/review-queue", requireExactRole("EDITOR") as any, editorReviewQueueHandler);
router.post("/editor/series/:seriesId/start-review", requireExactRole("EDITOR") as any, startReview);
router.post("/editor/proposals/:proposalId/release-claim", requireExactRole("EDITOR") as any, releaseClaim);
router.post("/editor/series/:seriesId/request-revision", requireExactRole("EDITOR") as any, requestRevision);
router.post("/editor/series/:seriesId/reject", requireExactRole("EDITOR") as any, rejectSeries);
router.post("/editor/series/:seriesId/forward-to-board", requireExactRole("EDITOR") as any, forwardToBoard);

// Board mobile aliases
router.get("/board/queue", requireExactRole("BOARD", "EDITOR") as any, boardQueueHandler);
router.get("/board/series/:seriesId/votes", requireExactRole("BOARD", "EDITOR") as any, getBoardVotes);
router.post("/board/series/:seriesId/votes", requireExactRole("BOARD") as any, castVote);
router.post("/board/series/:seriesId/decisions/finalize", requireExactBoardChair as any, finalizeDecision);
router.post("/board/series/:seriesId/at-risk-decisions", requireExactBoardChair as any, atRiskDecision);

export default router;
