import type { VotingSession, VotingSessionStatus } from "@/entities/board/model/voting-types";
import { useVotingSessionsQuery } from "../sessions/api/sessions.queries";

const ACTIVE_SESSION_STATUSES: VotingSessionStatus[] = ["OPEN"];

export interface ActiveVotingSession {
  session: VotingSession | undefined;
  sessionId: string | undefined;
  expectedVersion: number | undefined;
  isOpen: boolean;
  hasActiveSession: boolean;
  isLoading: boolean;
}

/**
 * Single source of truth for "is there a live Board VotingSession for this proposal
 * right now". Mirrors the OPEN-only check the backend enforces in
 * workflow.service.ts's VOTE action (proposal.status alone is not enough — a
 * proposal can sit in PENDING_BOARD with no session yet), so every vote surface
 * agrees on when voting is actually possible instead of each re-deriving it.
 */
export function useActiveVotingSession(
  proposalId: string | undefined,
  enabled = true,
): ActiveVotingSession {
  const { data: sessions = [], isLoading } = useVotingSessionsQuery(enabled && Boolean(proposalId));

  const session = proposalId
    ? sessions.find(
        (vs) =>
          ACTIVE_SESSION_STATUSES.includes(vs.status) &&
          (vs.proposalId === proposalId || vs.proposalIds?.includes(proposalId)),
      )
    : undefined;

  return {
    session,
    sessionId: session?.id,
    expectedVersion: session?.version,
    isOpen: session?.status === "OPEN",
    hasActiveSession: Boolean(session),
    isLoading,
  };
}
