import { apiRequest } from "@/shared/api/client"

export type BoardVoteValue = "APPROVE" | "REJECT" | "NEEDS_REVISION"
export type AtRiskDecisionValue = "CONTINUE" | "WARNING" | "REQUEST_IMPROVEMENT_PLAN" | "CANCEL"

export interface BoardVoteSummary {
  APPROVE: number
  REJECT: number
  NEEDS_REVISION: number
}

export interface BoardVoteResponse {
  vote: unknown
  summary: BoardVoteSummary
}

export interface BoardDecisionResponse {
  status: string
  result?: BoardVoteValue
}

export interface BoardQueueItem {
  id: string
  seriesTitle: string
  ownerId: string
  seriesStatus: string
  decisionStatus: string
  voteSummary: BoardVoteSummary
  updatedAt: string
}

export interface AtRiskDecisionResponse {
  id: string
  decision: AtRiskDecisionValue
  note?: string
  createdAt?: string
}

export function listBoardQueue() {
  return apiRequest<BoardQueueItem[]>("/board/queue")
}

export function castBoardVote(seriesId: string, value: BoardVoteValue) {
  return apiRequest<BoardVoteResponse>(`/board/series/${seriesId}/votes`, {
    method: "POST",
    body: JSON.stringify({ value }),
  })
}

export function finalizeBoardDecision(seriesId: string) {
  return apiRequest<BoardDecisionResponse>(`/board/series/${seriesId}/decisions/finalize`, {
    method: "POST",
  })
}

export function tieBreakBoardDecision(seriesId: string, value: BoardVoteValue) {
  return apiRequest<BoardDecisionResponse>(`/board/series/${seriesId}/decisions/tie-break`, {
    method: "POST",
    body: JSON.stringify({ value }),
  })
}

export function createAtRiskDecision(seriesId: string, decision: AtRiskDecisionValue, note?: string) {
  return apiRequest<AtRiskDecisionResponse>(`/board/series/${seriesId}/at-risk-decisions`, {
    method: "POST",
    body: JSON.stringify({ decision, note }),
  })
}
