import { nowIso } from "../domain/ids.js";
import { UserModel } from "../db/models.js";
import { AppError } from "../lib/http.js";
import type { ProposalStatus, TiePolicy, VoteDecision } from "../types.js";

export const BOARD_TOTAL = 5;
export const BOARD_QUORUM = 3;
export const BOARD_MAX_VOTING_ROUND = 2;
export const BOARD_DEFAULT_TIE_POLICY: TiePolicy = "CHAIR_DECIDES";
export const BOARD_TIE_POLICIES: readonly TiePolicy[] = [
  "CHAIR_DECIDES",
  "REJECT",
  "RETURN_TO_BOARD",
];

export function normalizeTiePolicy(value: unknown): TiePolicy {
  return BOARD_TIE_POLICIES.includes(value as TiePolicy)
    ? (value as TiePolicy)
    : BOARD_DEFAULT_TIE_POLICY;
}

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
  const validVotes = votes.filter(
    (vote) => vote.decision === "APPROVE" || vote.decision === "REJECT",
  );
  const approve = validVotes
    .filter((vote) => vote.decision === "APPROVE")
    .reduce((sum, vote) => sum + Number(vote.weight ?? 1), 0);
  const reject = validVotes
    .filter((vote) => vote.decision === "REJECT")
    .reduce((sum, vote) => sum + Number(vote.weight ?? 1), 0);
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
  if (approve > reject)
    return {
      approve,
      reject,
      total,
      status: "APPROVED" as ProposalStatus,
      reason: `Board majority ${approve} APPROVE to ${reject} REJECT.`,
    };
  if (reject > approve)
    return {
      approve,
      reject,
      total,
      status: "REJECTED" as ProposalStatus,
      reason: `Board majority ${reject} REJECT to ${approve} APPROVE.`,
    };
  if (total >= eligibleVoterCount && approve === reject) {
    return {
      approve,
      reject,
      total,
      status: null,
      reason: "Full-turnout tie. The VotingSession tie policy determines the next step.",
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

export function normalizeBoardVote(vote: any) {
  return {
    voterId: String(vote.voterId ?? ""),
    voterName: String(vote.voterName ?? ""),
    decision: vote.decision as VoteDecision,
    comment: vote.comment,
    createdAt: vote.createdAt ?? nowIso(),
    weight: Number(vote.weight ?? 1),
  };
}
