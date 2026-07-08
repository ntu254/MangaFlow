import { Router } from "express";
import { requireRole } from "../middleware/auth.js";
import {
  listProposals,
  createProposal,
  getProposal,
  patchProposal,
  deleteProposal,
  proposalAction
} from "../controllers/proposal.controller.js";

const router = Router();

router.get("/proposals", listProposals);
router.post("/proposals", requireRole("MANGAKA", "EDITOR") as any, createProposal);
router.get("/proposals/:id", getProposal);
router.patch("/proposals/:id", patchProposal);
router.delete("/proposals/:id", requireRole("MANGAKA", "EDITOR") as any, deleteProposal);
router.post(
  "/proposals/:id/actions/:action",
  requireRole("MANGAKA", "EDITOR", "BOARD") as any,
  proposalAction,
);

export default router;
