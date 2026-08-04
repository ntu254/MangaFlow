import { apiRequest } from "./client";
import type {
  CreateVotingSessionRequest,
  UpdateVotingSessionRequest,
  CastVoteRequest,
  AtRiskDecisionRequest,
} from "./services";

export const boardApi = {
  sessions: () => apiRequest("/voting-sessions"),
  session: (id: string) => apiRequest(`/voting-sessions/${id}`),
  createSession: (body: CreateVotingSessionRequest) =>
    apiRequest("/voting-sessions", { method: "POST", body }),
  updateSession: (id: string, body: UpdateVotingSessionRequest) =>
    apiRequest(`/voting-sessions/${id}`, { method: "PATCH", body }),
  closeSession: (id: string) =>
    apiRequest(`/voting-sessions/${id}/close`, { method: "POST", body: {} }),
  resolveTie: (id: string, body: { decision: "APPROVED" | "REJECTED"; note: string; expectedVersion?: number }) =>
    apiRequest(`/voting-sessions/${id}/resolve-tie`, { method: "POST", body }),
  cancelSession: (id: string) =>
    apiRequest(`/voting-sessions/${id}/cancel`, { method: "POST", body: {} }),
  addSessionNote: (id: string, body: { text: string }) =>
    apiRequest(`/voting-sessions/${id}/notes`, { method: "POST", body }),
  updateSessionNote: (id: string, noteId: string, body: { text: string }) =>
    apiRequest(`/voting-sessions/${id}/notes/${noteId}`, { method: "PATCH", body }),
  deleteSessionNote: (id: string, noteId: string) =>
    apiRequest(`/voting-sessions/${id}/notes/${noteId}`, { method: "DELETE" }),
  queue: () => apiRequest("/board/queue"),
  getVotes: (seriesId: string) => apiRequest(`/board/series/${seriesId}/votes`),
  castVote: (seriesId: string, body: CastVoteRequest) =>
    apiRequest(`/board/series/${seriesId}/votes`, { method: "POST", body }),
  atRiskDecision: (seriesId: string, body: AtRiskDecisionRequest) =>
    apiRequest(`/board/series/${seriesId}/at-risk-decisions`, { method: "POST", body }),
  rankings: () => apiRequest("/rankings"),
  rankingPeriods: () => apiRequest("/rankings/periods"),
  importRankings: (body: unknown) => apiRequest("/rankings/import", { method: "POST", body }),
  decisionHistory: () => apiRequest("/board/decisions/history"),
};
