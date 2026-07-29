import type { VotingSessionStatus } from "@/entities/board/model/voting-types";

type ActiveVotingSessionSummary = {
  status: VotingSessionStatus;
  reVoteOfSessionId?: string;
};

export type ReVoteBanner =
  | {
      kind: "fresh";
      title: string;
      description: string;
    }
  | {
      kind: "legacy";
      title: string;
      description: string;
    }
  | null;

export function getReVoteBanner(
  activeSession: ActiveVotingSessionSummary | undefined,
  legacyStatus: string | null | undefined,
): ReVoteBanner {
  if (activeSession?.status === "OPEN" && activeSession.reVoteOfSessionId) {
    return {
      kind: "fresh",
      title: "Fresh re-vote is open",
      description:
        "The prior round ended in a tie. Vote in the fresh open re-vote session shown above.",
    };
  }

  if (legacyStatus === "TIE_BREAK_REQUIRED") {
    return {
      kind: "legacy",
      title: "Historical tie-break record",
      description:
        "This historical session requires a tie-break under the legacy workflow. No fresh re-vote session is currently indicated.",
    };
  }

  return null;
}
