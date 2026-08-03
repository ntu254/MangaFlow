import type { SeriesProposal } from "./proposal-types";

export function decisionEffect(proposal: SeriesProposal, decision?: "APPROVE" | "REJECT") {
  if (!decision) return "Select a decision to see its impact.";
  if (decision === "APPROVE")
    return `${proposal.title} may proceed to slate serialization if quorum is reached.`;
  return `${proposal.title} may be rejected if reject quorum is reached.`;
}
