import type { VoteDecision } from "@/entities/proposal/model/proposal-types";
import {
  mapBoardQueueItem,
  mapBoardVotes,
  type AtRiskQueueItem,
  type BoardQueueItem,
  type BoardVotesResult,
} from "../model/board-adapters";
import { proposalKeys } from "@/features/proposals";
import { rankingKeys, seriesKeys } from "@/entities/series";
import { ApiRequestError, apiRequest } from "@/shared/api/client";
import { useAuth } from "@/shared/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const boardKeys = {
  all: ["board"] as const,
  queue: () => [...boardKeys.all, "queue"] as const,
  votes: (seriesId: string) => [...boardKeys.all, "votes", seriesId] as const,
  sessions: () => [...boardKeys.all, "sessions"] as const,
  decisions: () => [...boardKeys.all, "decisions"] as const,
};

function isBoardWorkflowUser(role: string): boolean {
  return role === "board" || role === "admin" || role === "editor";
}

async function invalidateBoardDecisionCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  seriesId: string,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: boardKeys.all }),
    queryClient.invalidateQueries({ queryKey: boardKeys.votes(seriesId) }),
    queryClient.invalidateQueries({ queryKey: proposalKeys.detail(seriesId) }),
    queryClient.invalidateQueries({ queryKey: proposalKeys.all }),
    queryClient.invalidateQueries({ queryKey: seriesKeys.mine() }),
  ]);
}

export function useBoardQueueQuery() {
  const user = useAuth((s) => s.user);

  return useQuery<Array<BoardQueueItem | AtRiskQueueItem>, Error>({
    queryKey: boardKeys.queue(),
    queryFn: async () => {
      const rows = await apiRequest<Record<string, unknown>[]>("/board/queue");
      return rows.map(mapBoardQueueItem);
    },
    enabled: Boolean(user && isBoardWorkflowUser(user.role)),
    staleTime: 30000,
  });
}

export function useBoardVotesQuery(seriesId: string) {
  const user = useAuth((s) => s.user);

  return useQuery<BoardVotesResult, Error>({
    queryKey: boardKeys.votes(seriesId),
    queryFn: async () => {
      const raw = await apiRequest<Record<string, unknown>>(`/board/series/${seriesId}/votes`);
      return mapBoardVotes(raw);
    },
    enabled: Boolean(user && isBoardWorkflowUser(user.role) && seriesId),
    staleTime: 15000,
  });
}

export function useCastBoardVoteMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    Record<string, unknown>,
    Error,
    {
      seriesId: string;
      body: {
        voteDecision: "APPROVE" | "REJECT";
        comment?: string;
        sessionId?: string;
        expectedVersion?: number;
      };
    }
  >({
    mutationFn: ({ seriesId, body }) =>
      apiRequest<Record<string, unknown>>(`/board/series/${seriesId}/votes`, {
        method: "POST",
        body,
      }),
    onSuccess: (_data, variables) => {
      return invalidateBoardDecisionCaches(queryClient, variables.seriesId);
    },
  });
}

export function useFinalizeDecisionMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    Record<string, unknown>,
    Error,
    {
      seriesId: string;
      sessionId: string;
      body?: {
        decision?: "APPROVED" | "REJECTED";
        note?: string;
        publicationType?: "WEEKLY" | "MONTHLY";
        expectedVersion?: number;
      };
    }
  >({
    mutationFn: ({ sessionId, body }) =>
      apiRequest<Record<string, unknown>>(`/voting-sessions/${sessionId}/close`, {
        method: "POST",
        body: body ?? {},
      }),
    onSuccess: (_data, variables) => {
      return invalidateBoardDecisionCaches(queryClient, variables.seriesId);
    },
  });
}

export function useAtRiskDecisionMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    Record<string, unknown>,
    Error,
    { seriesId: string; body: { rankingId: string; decision: string; note?: string } }
  >({
    mutationFn: ({ seriesId, body }) =>
      apiRequest<Record<string, unknown>>(`/board/series/${seriesId}/at-risk-decisions`, {
        method: "POST",
        body,
      }),
    onSuccess: () => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: boardKeys.all }),
        queryClient.invalidateQueries({ queryKey: rankingKeys.list() }),
      ]);
    },
  });
}

export { useVotingSessionsQuery } from "../sessions/api/sessions.queries";

export { useCreateVotingSessionMutation } from "../sessions/api/sessions.queries";

// Keyed by the backend's AppError `code` (see backend/src/services/workflow.service.ts
// and voting.controller.ts) — not by message text. The envelope carries `code` and
// `message` as separate fields (src/shared/api/client.ts), so matching against
// `err.message` silently never hits and falls through to the raw server string.
const BOARD_ERROR_MESSAGE: Record<string, string> = {
  DUPLICATE_VOTE: "You have already voted on this proposal.",
  VOTE_ALREADY_CAST: "You have already voted in this round.",
  INVALID_TRANSITION: "Current status does not allow voting.",
  PROPOSAL_NOT_FOUND: "Proposal not found.",
  BOARD_CHAIR_REQUIRED: "Only the Board Chair can perform this action.",
  FORBIDDEN: "You do not have permission for this action.",
  SESSION_ID_REQUIRED:
    "No VotingSession is open for this proposal yet. Ask the Board chair to open one before voting.",
  SESSION_NOT_ACTIVE:
    "This VotingSession is no longer active (closed, cancelled, or not opened yet). Refresh the Board queue and try again.",
  REVIEW_SNAPSHOT_STALE:
    "The proposal changed since this VotingSession was opened. Ask the Board chair to open a new session.",
  VERSION_CONFLICT: "This VotingSession changed while you were voting. Refresh and try again.",
  TIE_RESOLUTION_NOT_READY: "Only the final tied re-vote can be resolved by the Chair.",
  TIE_POLICY_AUTOMATIC: "This tie is resolved automatically by the session policy.",
};

export function mapBoardApiError(err: unknown): string {
  if (err instanceof ApiRequestError && err.code && BOARD_ERROR_MESSAGE[err.code]) {
    return BOARD_ERROR_MESSAGE[err.code];
  }
  if (err instanceof Error) return err.message;
  return "An unknown error occurred.";
}

export { useAddVotingSessionNoteMutation } from "../sessions/api/sessions.queries";

export {
  useCancelVotingSessionMutation,
  useCloseVotingSessionMutation,
  useResolveVotingTieMutation,
  useVotingSessionQuery,
} from "../sessions/api/sessions.queries";
