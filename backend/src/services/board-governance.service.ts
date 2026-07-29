import { nowIso } from "../domain/ids.js";
import { UserModel } from "../db/models.js";
import { AppError } from "../lib/http.js";
import type { ProposalStatus, VoteDecision } from "../types.js";

export const BOARD_TOTAL = 5;
export const DEFAULT_BOARD_ELIGIBLE_VOTER_IDS = [
  "u-board",
  "u-board-2",
  "u-board-3",
  "u-board-4",
  "u-board-5",
];
export const BOARD_QUORUM = 3;
export const EIC_TIEBREAK_WEIGHT = 2;

export async function activeBoardElectorate() {
  const voters = await UserModel.find({
    role: "BOARD",
    active: { $ne: false },
  })
    .sort({ isChair: -1, createdAt: 1, id: 1 })
    .select({ id: 1, isChair: 1 })
    .lean();

  if (voters.length < BOARD_QUORUM) {
    throw new AppError(
      409,
      `At least ${BOARD_QUORUM} active Board members are required to open a voting session.`,
      "BOARD_QUORUM_UNAVAILABLE",
    );
  }
  if (voters.length > BOARD_TOTAL) {
    throw new AppError(
      409,
      `The active Board roster exceeds the configured maximum of ${BOARD_TOTAL}.`,
      "BOARD_ROSTER_INVALID",
    );
  }
  if (voters.filter((voter: any) => voter.isChair).length !== 1) {
    throw new AppError(
      409,
      "Exactly one active Board Chair is required to open a voting session.",
      "BOARD_CHAIR_CONFIGURATION_INVALID",
    );
  }

  return voters.map((voter: any) => String(voter.id));
}

export function evaluateBoardTally(
  votes: any[],
  quorum = BOARD_QUORUM,
  eligibleVoterCount = BOARD_TOTAL,
) {
  const approve = votes
    .filter((vote) => vote.decision === "APPROVE")
    .reduce((sum, vote) => sum + Number(vote.weight ?? 1), 0);
  const reject = votes
    .filter((vote) => vote.decision === "REJECT")
    .reduce((sum, vote) => sum + Number(vote.weight ?? 1), 0);
  const abstain = votes.filter((vote) => vote.decision === "ABSTAIN").length;
  const total = votes.length;

  if (approve >= quorum)
    return {
      approve,
      reject,
      abstain,
      total,
      status: "APPROVED" as ProposalStatus,
      reason: `Quorum ${approve} APPROVE >= ${quorum}.`,
    };
  if (reject >= quorum)
    return {
      approve,
      reject,
      abstain,
      total,
      status: "REJECTED" as ProposalStatus,
      reason: `Quorum ${reject} REJECT >= ${quorum}.`,
    };
  if (total >= eligibleVoterCount && approve === reject) {
    return {
      approve,
      reject,
      abstain,
      total,
      status: "TIE_BREAK" as ProposalStatus,
      reason: "Split vote. Editor-in-chief tie-break required.",
    };
  }
  return {
    approve,
    reject,
    abstain,
    total,
    status: null,
    reason: `Waiting for more votes (${total}/${eligibleVoterCount}).`,
  };
}

export function normalizeBoardVote(vote: any) {
  return {
    memberId: String(vote.memberId ?? vote.voterId ?? ""),
    memberName: String(vote.memberName ?? vote.voterName ?? ""),
    decision: vote.decision as VoteDecision,
    comment: vote.comment,
    createdAt: vote.createdAt ?? vote.votedAt ?? nowIso(),
    weight: Number(vote.weight ?? 1),
    isChair: Boolean(vote.isChair ?? false),
    isEditorInChief: Boolean(vote.isEditorInChief ?? false),
  };
}
