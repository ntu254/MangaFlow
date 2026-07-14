import { asyncRoute, ok } from "../../../lib/http.js";
import type { AuthedRequest } from "../../../types.js";
import {
  castBoardProposalVote,
  finalizeBoardProposal,
} from "../application/board-proposal.service.js";
import {
  boardProposalFinalizationSchema,
  boardProposalVoteSchema,
} from "./board-proposal.schemas.js";

export const castProposalVote = asyncRoute(async (req: AuthedRequest, res) => {
  const payload = boardProposalVoteSchema.parse(req.body);
  ok(res, await castBoardProposalVote(req, String(req.params.proposalId), payload));
});

export const finalizeProposal = asyncRoute(async (req: AuthedRequest, res) => {
  const payload = boardProposalFinalizationSchema.parse(req.body);
  ok(res, await finalizeBoardProposal(req, String(req.params.proposalId), payload));
});
