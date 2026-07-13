import type { BoardVote, ProposalStatus } from "./proposal-types";
import { BOARD_QUORUM, BOARD_TOTAL, EIC_TIEBREAK_WEIGHT } from "./proposal-types";

export type TallyResult = {
  approve: number;
  reject: number;
  abstain: number;
  total: number;
  status: ProposalStatus | null;
  reason: string;
};

export function evaluateBoardTally(votes: BoardVote[]): TallyResult {
  const approve = votes
    .filter((v) => v.decision === "APPROVE")
    .reduce((s, v) => s + (v.weight ?? 1), 0);
  const reject = votes
    .filter((v) => v.decision === "REJECT")
    .reduce((s, v) => s + (v.weight ?? 1), 0);
  const abstain = votes.filter((v) => v.decision === "ABSTAIN").length;
  const total = votes.length;

  if (approve >= BOARD_QUORUM)
    return {
      approve,
      reject,
      abstain,
      total,
      status: "APPROVED",
      reason: `Quorum ${approve} APPROVE ≥ ${BOARD_QUORUM}.`,
    };
  if (reject >= BOARD_QUORUM)
    return {
      approve,
      reject,
      abstain,
      total,
      status: "REJECTED",
      reason: `Quorum ${reject} REJECT ≥ ${BOARD_QUORUM}.`,
    };

  if (total >= BOARD_TOTAL) {
    if (approve > reject)
      return {
        approve,
        reject,
        abstain,
        total,
        status: "APPROVED",
        reason: `All ${BOARD_TOTAL} votes: APPROVE > REJECT.`,
      };
    if (reject > approve)
      return {
        approve,
        reject,
        abstain,
        total,
        status: "REJECTED",
        reason: `All ${BOARD_TOTAL} votes: REJECT > APPROVE.`,
      };
    return {
      approve,
      reject,
      abstain,
      total,
      status: "TIE_BREAK",
      reason: `Tied ${approve}-${reject}. Waiting for the Editor-in-chief tie-break vote (weight ${EIC_TIEBREAK_WEIGHT}).`,
    };
  }

  return {
    approve,
    reject,
    abstain,
    total,
    status: null,
    reason: `Waiting for more votes (${total}/${BOARD_TOTAL}).`,
  };
}
