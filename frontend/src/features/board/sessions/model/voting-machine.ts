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
  else if (tally.status === "TIE_BREAK") decision = "TIE_BREAK_REQUIRED";
  else decision = "PENDING";
  return {
    proposalId: p.id,
    decision,
    approve: tally.approve,
    reject: tally.reject,
    reason: tally.reason,
  };
}

export function canCloseSession(session: VotingSession) {
  if (session.status !== "OPEN") return { ok: false, reason: "Session is closed or cancelled." };
  return { ok: true };
}
