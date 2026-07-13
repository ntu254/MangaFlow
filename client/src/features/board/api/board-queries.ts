import type { VoteDecision } from "@/entities/proposal/model/proposal-types";
import {
  mapBoardQueueItem,
  mapBoardVotes,
  type AtRiskQueueItem,
  type BoardQueueItem,
  type BoardVotesResult,
} from "../model/board-adapters";
import { proposalKeys } from "@/features/proposals";
import { seriesKeys } from "@/entities/series";
import { apiRequest } from "@/shared/api/client";
import { useAuth } from "@/shared/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const boardKeys = {
  all: ["board"] as const,
  queue: () => [...boardKeys.all, "queue"] as const,
  votes: (seriesId: string) => [...boardKeys.all, "votes", seriesId] as const,
  sessions: () => [...boardKeys.all, "sessions"] as const,
};

function isBoardWorkflowUser(role: string): boolean {
  return role === "board" || role === "admin" || role === "editor";
}

function invalidateBoardDecisionCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  seriesId: string,
) {
  queryClient.invalidateQueries({ queryKey: boardKeys.votes(seriesId) });
  queryClient.invalidateQueries({ queryKey: boardKeys.queue() });
  queryClient.invalidateQueries({ queryKey: proposalKeys.detail(seriesId) });
  queryClient.invalidateQueries({ queryKey: proposalKeys.all });
  queryClient.invalidateQueries({ queryKey: seriesKeys.mine() });
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
    { seriesId: string; body: { voteDecision: VoteDecision; comment?: string } }
  >({
    mutationFn: ({ seriesId, body }) =>
      apiRequest<Record<string, unknown>>(`/board/series/${seriesId}/votes`, {
        method: "POST",
        body,
      }),
    onSuccess: (_data, variables) => {
      invalidateBoardDecisionCaches(queryClient, variables.seriesId);
    },
  });
}

export function useCastVoteMutation(seriesId: string) {
  const queryClient = useQueryClient();

  return useMutation<Record<string, unknown>, Error, { decision: VoteDecision; comment?: string }>({
    mutationFn: (body) =>
      apiRequest<Record<string, unknown>>(`/board/series/${seriesId}/votes`, {
        method: "POST",
        body: { voteDecision: body.decision, comment: body.comment },
      }),
    onSuccess: () => {
      invalidateBoardDecisionCaches(queryClient, seriesId);
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
      body: {
        decision: "APPROVED" | "REJECTED";
        note?: string;
        publicationType?: "WEEKLY" | "BIWEEKLY" | "MONTHLY";
      };
    }
  >({
    mutationFn: ({ seriesId, body }) =>
      apiRequest<Record<string, unknown>>(`/board/series/${seriesId}/decisions/finalize`, {
        method: "POST",
        body,
      }),
    onSuccess: (_data, variables) => {
      invalidateBoardDecisionCaches(queryClient, variables.seriesId);
    },
  });
}

export function useFinalizeSeriesDecisionMutation(seriesId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    Record<string, unknown>,
    Error,
    { decision: "APPROVED" | "REJECTED"; note?: string }
  >({
    mutationFn: (body) =>
      apiRequest<Record<string, unknown>>(`/board/series/${seriesId}/decisions/finalize`, {
        method: "POST",
        body: { decision: body.decision, note: body.note },
      }),
    onSuccess: () => {
      invalidateBoardDecisionCaches(queryClient, seriesId);
    },
  });
}

export function useTieBreakMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    Record<string, unknown>,
    Error,
    { seriesId: string; body: { voteDecision: VoteDecision; comment?: string } }
  >({
    mutationFn: ({ seriesId, body }) =>
      apiRequest<Record<string, unknown>>(`/board/series/${seriesId}/decisions/tie-break`, {
        method: "POST",
        body,
      }),
    onSuccess: (_data, variables) => {
      invalidateBoardDecisionCaches(queryClient, variables.seriesId);
    },
  });
}

export function useTieBreakSeriesMutation(seriesId: string) {
  const queryClient = useQueryClient();

  return useMutation<Record<string, unknown>, Error, { decision: VoteDecision; comment?: string }>({
    mutationFn: (body) =>
      apiRequest<Record<string, unknown>>(`/board/series/${seriesId}/decisions/tie-break`, {
        method: "POST",
        body: { voteDecision: body.decision, comment: body.comment },
      }),
    onSuccess: () => {
      invalidateBoardDecisionCaches(queryClient, seriesId);
    },
  });
}

export function useAtRiskDecisionMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    Record<string, unknown>,
    Error,
    { seriesId: string; body: { decision?: string; note?: string } }
  >({
    mutationFn: ({ seriesId, body }) =>
      apiRequest<Record<string, unknown>>(`/board/series/${seriesId}/at-risk-decisions`, {
        method: "POST",
        body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.queue() });
    },
  });
}

export { useVotingSessionsQuery } from "../sessions/api/sessions.queries";

export { useCreateVotingSessionMutation } from "../sessions/api/sessions.queries";

export function mapBoardApiError(err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message;
    if (msg.includes("DUPLICATE_VOTE")) return "You have already voted on this proposal.";
    if (msg.includes("INVALID_TRANSITION")) return "The current status does not allow voting.";
    if (msg.includes("NOT_FOUND")) return "Proposal not found.";
    if (msg.includes("EIC_REQUIRED")) return "Only the Editor-in-chief can break ties.";
    if (msg.includes("BOARD_CHAIR_REQUIRED"))
      return "Only the Board Chair can perform this action.";
    if (msg.includes("FORBIDDEN")) return "You do not have permission to perform this action.";
    return msg;
  }
  return "An unknown error occurred.";
}

export { useAddVotingSessionNoteMutation } from "../sessions/api/sessions.queries";

export {
  useCancelVotingSessionMutation,
  useCloseVotingSessionMutation,
  useVotingSessionQuery,
} from "../sessions/api/sessions.queries";
