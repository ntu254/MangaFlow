import { apiClient } from "@/shared/lib/axios"
import type { ApiResponse } from "@/shared/types"
import type { PublicationType, SeriesDraft, SeriesSummaryManuscript } from "@/features/series/services/series.api"

export interface EditorReviewQueueItem {
  series: SeriesDraft
  manuscript: SeriesSummaryManuscript | null
}

export interface EditorSeriesReview {
  series: SeriesDraft
  manuscript: SeriesSummaryManuscript
}

export interface EditorRevisionInput {
  revisionReason: string
  feedbackSummary: string
}

export interface EditorRejectInput {
  rejectReason: string
}

export interface EditorForwardInput {
  editorRecommendation: string
  feasibilityNote: string
  suggestedPublicationType: PublicationType
  riskNote?: string
}

export const editorApi = {
  reviewQueue: () =>
    apiClient.get<ApiResponse<EditorReviewQueueItem[]>>("/editor/manuscripts/review-queue"),

  getSeriesReview: (seriesId: string) =>
    apiClient.get<ApiResponse<EditorSeriesReview>>(`/editor/series/${seriesId}/review`),

  requestRevision: (seriesId: string, input: EditorRevisionInput) =>
    apiClient.post<ApiResponse<SeriesSummaryManuscript>>(`/editor/series/${seriesId}/request-revision`, input),

  reject: (seriesId: string, input: EditorRejectInput) =>
    apiClient.post<ApiResponse<SeriesSummaryManuscript>>(`/editor/series/${seriesId}/reject`, input),

  forwardToBoard: (seriesId: string, input: EditorForwardInput) =>
    apiClient.post<ApiResponse<SeriesSummaryManuscript>>(`/editor/series/${seriesId}/forward-to-board`, input),
}
