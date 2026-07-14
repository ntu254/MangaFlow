import { Router } from "express";
import { requireRole } from "../middleware/auth.js";
import {
  castProposalVote,
  castProposalTieBreakVote,
  finalizeProposal,
  getProposalVotes,
  listBoardQueue,
} from "../modules/board/presentation/board-proposal.controller.js";

const router = Router();

router.get("/board/queue", requireRole("BOARD") as any, listBoardQueue);
router.get(
  "/board/proposals/:proposalId/votes",
  requireRole("BOARD", "EDITOR") as any,
  getProposalVotes,
);
router.post(
  "/board/proposals/:proposalId/votes",
  requireRole("BOARD") as any,
  castProposalVote,
);
router.post(
  "/board/proposals/:proposalId/tie-break",
  requireRole("EDITOR") as any,
  castProposalTieBreakVote,
);
router.post(
  "/board/proposals/:proposalId/finalization",
  requireRole("BOARD") as any,
  finalizeProposal,
);

export default router;
