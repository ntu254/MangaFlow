import { applyProposalAction } from "../../../services/workflow.service.js";
import type { AuthedRequest } from "../../../types.js";

export function castBoardProposalVote(
  req: AuthedRequest,
  proposalId: string,
  payload: Record<string, unknown>,
) {
  return applyProposalAction(req, proposalId, "VOTE", payload);
}

export function finalizeBoardProposal(
  req: AuthedRequest,
  proposalId: string,
  payload: {
    decision: "APPROVED" | "REJECTED";
    note?: string;
    publicationType?: string;
    tantouEditorId?: string;
    editorId?: string;
  },
) {
  return applyProposalAction(req, proposalId, "FORCE_STATUS", {
    forceStatus: payload.decision,
    comment: payload.note,
    publicationType: payload.publicationType,
    tantouEditorId: payload.tantouEditorId ?? payload.editorId,
  });
}
