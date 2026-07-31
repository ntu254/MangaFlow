import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { boardApi } from "@/shared/api/services";
import { apiRequest } from "@/shared/api/client";
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
      queryClient.invalidateQueries({ queryKey: boardKeys.sessions() });
    },
  });
}

export function useUpdateVotingSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation<VotingSession, Error, { sessionId: string; body: Partial<VotingSession> }>({
    mutationFn: ({ sessionId, body }) =>
      boardApi.updateSession(sessionId, body) as Promise<VotingSession>,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: boardKeys.sessions() });
      queryClient.invalidateQueries({
        queryKey: [...boardKeys.all, "session", variables.sessionId],
      });
    },
  });
}

export function useAddVotingSessionNoteMutation(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation<Record<string, unknown>, Error, { text: string }>({
    mutationFn: (body) =>
      boardApi.addSessionNote(sessionId, body) as Promise<Record<string, unknown>>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: [...boardKeys.all, "session", sessionId] });
    },
  });
}

export function useCancelVotingSessionMutation() {
  const queryClient = useQueryClient();
  return useMutation<VotingSession, Error, string>({
    mutationFn: (sessionId) => boardApi.cancelSession(sessionId) as Promise<VotingSession>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.sessions() });
    },
  });
}

export function useCloseVotingSessionMutation() {
  const queryClient = useQueryClient();
  return useMutation<VotingSession, Error, string>({
    mutationFn: (sessionId) => boardApi.closeSession(sessionId) as Promise<VotingSession>,
    onSuccess: (_data, sessionId) => {
      queryClient.invalidateQueries({ queryKey: boardKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: [...boardKeys.all, "session", sessionId] });
      queryClient.invalidateQueries({ queryKey: boardKeys.queue() });
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
