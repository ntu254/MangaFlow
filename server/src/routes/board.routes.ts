import { Router } from "express";
import { requireRole } from "../middleware/auth.js";
import {
  castProposalVote,
  finalizeProposal,
  listBoardQueue,
} from "../modules/board/presentation/board-proposal.controller.js";

const router = Router();

router.get("/board/queue", requireRole("BOARD") as any, listBoardQueue);
router.post("/board/proposals/:proposalId/votes", requireRole("BOARD") as any, castProposalVote);
router.post(
  "/board/proposals/:proposalId/finalization",
  requireRole("BOARD") as any,
  finalizeProposal,
);

export default router;
