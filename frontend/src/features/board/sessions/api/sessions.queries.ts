import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { boardApi } from "@/shared/api/services";
import { apiRequest } from "@/shared/api/client";
import { proposalKeys } from "@/features/proposals";
import { boardKeys } from "../../api/board-queries";
import type { VotingSession } from "@/entities/board/model/voting-types";

export function useVotingSessionsQuery(enabled = true) {
  return useQuery<VotingSession[], Error>({
    queryKey: boardKeys.sessions(),
    queryFn: () => apiRequest<VotingSession[]>("/voting-sessions"),
    enabled,
    staleTime: 30000,
  });
}

export function useCreateVotingSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation<VotingSession, Error, unknown>({
    mutationFn: (body) =>
      apiRequest<VotingSession>("/voting-sessions", {
        method: "POST",
        body,
      }),
    onSuccess: () => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: boardKeys.all }),
        queryClient.invalidateQueries({ queryKey: proposalKeys.all }),
      ]);
    },
  });
}

export function useUpdateVotingSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation<VotingSession, Error, { sessionId: string; body: Partial<VotingSession> }>({
    mutationFn: ({ sessionId, body }) =>
      boardApi.updateSession(sessionId, body) as Promise<VotingSession>,
    onSuccess: (_data, variables) => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: boardKeys.all }),
        queryClient.invalidateQueries({ queryKey: proposalKeys.all }),
        queryClient.invalidateQueries({
          queryKey: [...boardKeys.all, "session", variables.sessionId],
        }),
      ]);
    },
  });
}

export function useAddVotingSessionNoteMutation(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation<Record<string, unknown>, Error, { text: string }>({
    mutationFn: (body) =>
      boardApi.addSessionNote(sessionId, body) as Promise<Record<string, unknown>>,
    onSuccess: () => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: boardKeys.all }),
        queryClient.invalidateQueries({ queryKey: [...boardKeys.all, "session", sessionId] }),
      ]);
    },
  });
}

export function useCancelVotingSessionMutation() {
  const queryClient = useQueryClient();
  return useMutation<VotingSession, Error, string>({
    mutationFn: (sessionId) => boardApi.cancelSession(sessionId) as Promise<VotingSession>,
    onSuccess: () => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: boardKeys.all }),
        queryClient.invalidateQueries({ queryKey: proposalKeys.all }),
      ]);
    },
  });
}

export function useCloseVotingSessionMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    VotingSession,
    Error,
    {
      sessionId: string;
      body?: {
        expectedVersion?: number;
        note?: string;
        publicationType?: "WEEKLY" | "MONTHLY";
      };
    }
  >({
    mutationFn: ({ sessionId, body }) =>
      apiRequest<VotingSession>(`/voting-sessions/${sessionId}/close`, {
        method: "POST",
        body: body ?? {},
      }),
    onSuccess: (_data, { sessionId }) => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: boardKeys.all }),
        queryClient.invalidateQueries({ queryKey: proposalKeys.all }),
        queryClient.invalidateQueries({ queryKey: [...boardKeys.all, "session", sessionId] }),
      ]);
    },
  });
}

export function useResolveVotingTieMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    VotingSession,
    Error,
    { sessionId: string; body: { decision: "APPROVED" | "REJECTED"; note: string; expectedVersion?: number } }
  >({
    mutationFn: ({ sessionId, body }) =>
      boardApi.resolveTie(sessionId, body) as Promise<VotingSession>,
    onSuccess: (_data, { sessionId }) => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: boardKeys.all }),
        queryClient.invalidateQueries({ queryKey: proposalKeys.all }),
        queryClient.invalidateQueries({ queryKey: [...boardKeys.all, "session", sessionId] }),
      ]);
    },
  });
}

export function useVotingSessionQuery(sessionId: string) {
  return useQuery<VotingSession, Error>({
    queryKey: [...boardKeys.all, "session", sessionId],
    queryFn: () => boardApi.session(sessionId) as Promise<VotingSession>,
    enabled: !!sessionId,
  });
}
