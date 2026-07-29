import { Router } from "express";
import { requireRole } from "../middleware/auth.js";
import {
  listProposals,
  createProposal,
  getProposal,
  listProposalVersions,
  getProposalVersion,
  patchProposal,
  deleteProposal,
  proposalAction
} from "../controllers/proposal.controller.js";

const router = Router();

router.get("/proposals", listProposals);
// Proposals are authored by Mangaka only. Editors review/act on proposals but
// must never be able to author one (prevents Editor self-review / self-approval).
router.post("/proposals", requireRole("MANGAKA") as any, createProposal);
router.get("/proposals/:id", getProposal);
router.get(
  "/proposals/:id/versions",
  requireRole("BOARD", "EDITOR", "MANGAKA") as any,
  listProposalVersions,
);
router.get(
  "/proposals/:id/versions/:versionId",
  requireRole("BOARD", "EDITOR", "MANGAKA") as any,
  getProposalVersion,
);
router.patch("/proposals/:id", patchProposal);
router.delete("/proposals/:id", requireRole("MANGAKA", "EDITOR") as any, deleteProposal);
router.post(
  "/proposals/:id/actions/:action",
  requireRole("MANGAKA", "EDITOR", "BOARD") as any,
  proposalAction,
);

export default router;
