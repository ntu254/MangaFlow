import type { BoardVote, ProposalStatus } from "./proposal-types";
import { BOARD_TOTAL } from "./proposal-types";

export type TallyResult = {
  approve: number;
  reject: number;
  total: number;
  status: ProposalStatus | null;
  reason: string;
};

export function evaluateBoardTally(
  votes: BoardVote[],
  quorum = Math.ceil(BOARD_TOTAL / 2),
  eligibleVoterCount = BOARD_TOTAL,
): TallyResult {
  const validVotes = votes.filter(
    (vote) => vote.decision === "APPROVE" || vote.decision === "REJECT",
  );
  const approve = validVotes
    .filter((vote) => vote.decision === "APPROVE")
    .reduce((sum, vote) => sum + (vote.weight ?? 1), 0);
  const reject = validVotes
    .filter((vote) => vote.decision === "REJECT")
    .reduce((sum, vote) => sum + (vote.weight ?? 1), 0);
  const total = validVotes.length;

  if (total < quorum) {
    return {
      approve,
      reject,
      total,
      status: null,
      reason: `Waiting for quorum (${total}/${quorum} votes).`,
    };
  }
  if (approve > reject) {
    return {
      approve,
      reject,
      total,
      status: "APPROVED",
      reason: `Board majority ${approve} APPROVE to ${reject} REJECT.`,
    };
  }
  if (reject > approve) {
    return {
      approve,
      reject,
      total,
      status: "REJECTED",
      reason: `Board majority ${reject} REJECT to ${approve} APPROVE.`,
    };
  }
  if (total >= eligibleVoterCount) {
    return {
      approve,
      reject,
      total,
      status: null,
      reason: `Tied ${approve}-${reject}. The VotingSession tie policy determines the next step.`,
    };
  }
  return {
    approve,
    reject,
    total,
    status: null,
      reason: `Waiting for more votes (${total}/${eligibleVoterCount}).`,
  };
}
