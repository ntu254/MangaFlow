import type { SeriesProposal } from "@/entities/proposal/model/proposal-types";
import { evaluateBoardTally } from "@/entities/proposal/model/board-tally";
import type {
  SessionOutcomeDecision,
  SessionProposalOutcome,
  VotingSession,
} from "@/entities/board/model/voting-types";

export function computeOutcome(p: SeriesProposal): SessionProposalOutcome {
  const tally = evaluateBoardTally(p.votes);
  let decision: SessionOutcomeDecision = "PENDING";
  if (p.status === "APPROVED") decision = "APPROVED";
  else if (p.status === "REJECTED") decision = "REJECTED";
  else if (p.status === "TIE_BREAK") decision = "NO_QUORUM";
  else decision = "PENDING";
  return {
    proposalId: p.id,
    decision,
    approve: tally.approve,
    reject: tally.reject,
    abstain: tally.abstain,
    reason: tally.reason,
  };
}

export function canCloseSession(session: VotingSession) {
  if (session.status !== "OPEN") return { ok: false, reason: "Session is closed/canceled." };
  return { ok: true };
}

export function canTieBreak(session: VotingSession, proposalId: string) {
  const outcome = session.outcomes.find((o) => o.proposalId === proposalId);
  if (!outcome) return { ok: false, reason: "No outcome yet." };
  if (outcome.decision !== "NO_QUORUM")
    return { ok: false, reason: "Outcome does not require a tie-break." };
  return { ok: true };
}
