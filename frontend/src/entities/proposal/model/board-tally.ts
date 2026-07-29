import type { BoardVote, ProposalStatus } from "./proposal-types";
import { BOARD_TOTAL, EIC_TIEBREAK_WEIGHT } from "./proposal-types";

export type TallyResult = {
  approve: number;
  reject: number;
  abstain: number;
  total: number;
  status: ProposalStatus | null;
  reason: string;
};

export function evaluateBoardTally(
  votes: BoardVote[],
  quorum = Math.ceil(BOARD_TOTAL / 2),
): TallyResult {
  const approve = votes
    .filter((v) => v.decision === "APPROVE")
    .reduce((s, v) => s + (v.weight ?? 1), 0);
  const reject = votes
    .filter((v) => v.decision === "REJECT")
    .reduce((s, v) => s + (v.weight ?? 1), 0);
  const abstain = votes.filter((v) => v.decision === "ABSTAIN").length;
  const total = votes.length;

  if (approve >= quorum)
    return {
      approve,
      reject,
      abstain,
      total,
      status: "APPROVED",
      reason: `Quorum ${approve} APPROVE ≥ ${quorum}.`,
    };
  if (reject >= quorum)
    return {
      approve,
      reject,
      abstain,
      total,
      status: "REJECTED",
      reason: `Quorum ${reject} REJECT ≥ ${quorum}.`,
    };

  if (total >= BOARD_TOTAL && approve === reject) {
    return {
      approve,
      reject,
      abstain,
      total,
      status: "TIE_BREAK",
      reason: `Tied ${approve}-${reject}. Awaiting Editor-in-Chief tie-break vote (weight ${EIC_TIEBREAK_WEIGHT}).`,
    };
  }

  if (total >= BOARD_TOTAL)
    return {
      approve,
      reject,
      abstain,
      total,
      status: null,
      reason: "No quorum reached. Close the session to return the proposal to Board review.",
    };

  return {
    approve,
    reject,
    abstain,
    total,
    status: null,
    reason: `Awaiting more votes (${total}/${BOARD_TOTAL}).`,
  };
}
