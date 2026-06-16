import { apiClient } from "@/shared/lib/axios"
import type { ApiResponse } from "@/shared/types"
import type { PublicationType } from "@/features/series/services/series.api"

export type BoardVoteValue = "APPROVE" | "REJECT" | "NEEDS_REVISION"

export interface BoardQueueItem {
  id: string
  seriesTitle: string
  ownerId: string
  seriesStatus: string
  requestedPublicationType?: PublicationType
  publicationType?: PublicationType
  decisionStatus: string
  voteSummary: Record<BoardVoteValue, number>
  voteCount: number
  sessionId: string | null
  updatedAt: string
}

export interface BoardVoteInput {
  value: BoardVoteValue
  note?: string
}

export interface BoardFinalizeInput {
  decision?: "APPROVED" | "REJECTED" | "NEEDS_REVISION"
  publicationType?: PublicationType
  note?: string
}

export interface BoardTieBreakInput {
  value: BoardVoteValue
  publicationType?: PublicationType
  note?: string
}

export const boardApi = {
  queue: () =>
    apiClient.get<ApiResponse<BoardQueueItem[]>>("/board/queue"),

  vote: (seriesId: string, input: BoardVoteInput) =>
    apiClient.post<ApiResponse<unknown>>(`/board/series/${seriesId}/vote`, input),

  finalize: (seriesId: string, input: BoardFinalizeInput) =>
    apiClient.post<ApiResponse<unknown>>(`/board/series/${seriesId}/finalize-decision`, input),

  tieBreak: (seriesId: string, input: BoardTieBreakInput) =>
    apiClient.post<ApiResponse<unknown>>(`/board/series/${seriesId}/tie-break`, input),
}
