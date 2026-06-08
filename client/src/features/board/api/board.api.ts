import { apiRequest } from "@/shared/api/client"

export type BoardVoteValue = "APPROVE" | "REJECT" | "NEEDS_REVISION"

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
