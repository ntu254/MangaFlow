import type { SeriesProposal } from "./proposal-types";

export function decisionEffect(
  proposal: SeriesProposal,
  decision?: "APPROVE" | "REJECT" | "NEEDS_REVISION" | "ABSTAIN",
) {
  if (!decision) return "Select a decision to preview its impact.";
  if (decision === "APPROVE")
    return `${proposal.title} can move to slate serialization if quorum is reached.`;
  if (decision === "NEEDS_REVISION")
    return `${proposal.title} will return to Editor/Mangaka with requested changes.`;
  if (decision === "ABSTAIN")
    return "Abstain records feedback but does not increase approve/reject quorum.";
  return `${proposal.title} can be rejected if the reject quorum is reached.`;
}
