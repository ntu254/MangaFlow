import type { VotingSessionStatus } from "@/entities/board/model/voting-types";

type ActiveVotingSessionSummary = {
  status: VotingSessionStatus;
  reVoteOfSessionId?: string;
};

export type ReVoteBanner = {
  kind: "fresh";
  title: string;
  description: string;
} | null;

export function getReVoteBanner(
  activeSession: ActiveVotingSessionSummary | undefined,
): ReVoteBanner {
  if (activeSession?.status !== "OPEN" || !activeSession.reVoteOfSessionId) return null;
  return {
    kind: "fresh",
    title: "Fresh re-vote is open",
    description: "The prior round ended in a tie. Vote in the fresh open re-vote session shown above.",
  };
}
