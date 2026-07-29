import type { SeriesProposal } from "./proposal-types";

export function decisionEffect(
  proposal: SeriesProposal,
  decision?: "APPROVE" | "REJECT" | "NEEDS_REVISION" | "ABSTAIN",
) {
  if (!decision) return "Select a decision to see its impact.";
  if (decision === "APPROVE")
    return `${proposal.title} may proceed to slate serialization if quorum is reached.`;
  if (decision === "NEEDS_REVISION")
    return `${proposal.title} will be returned to Editor/Mangaka with revision requests.`;
  if (decision === "ABSTAIN")
    return "Abstain records your input but does not count toward approve/reject quorum.";
  return `${proposal.title} may be rejected if reject quorum is reached.`;
}
