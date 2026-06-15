import axios from "axios"
import { apiClient } from "@/lib/axios"
import type { ApiResponse } from "@/types"

// ==================== TYPES ====================

export type SeriesUploadContentType =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "application/pdf"
  | "application/zip"

export interface CreateSeriesInput {
  title: string
  synopsis: string
  logline?: string
  premise?: string
  characters?: string
  conflict?: string
  targetAudience?: string
  publicationType?: string
  tags?: string[]
  genres?: string[]
}

export type UpdateSeriesInput = Partial<CreateSeriesInput>

export interface SeriesDraft {
  id: string
  title: string
  slug: string
  synopsis: string
  logline?: string
  premise?: string
  characters?: string
  conflict?: string
  targetAudience?: string
  publicationType?: string
  tags: string[]
  genres: string[]
  ownerId: string
  status: string
  createdAt: string
  updatedAt: string
}

export type SeriesListResponse = SeriesDraft[]

export interface CreateManuscriptUploadInput {
  originalName: string
  contentType: SeriesUploadContentType
  size: number
  expiresIn?: number
}

export interface CreateManuscriptUploadResponse {
  uploadUrl: string
  fileAssetId: string
  manuscriptId: string
  expiresIn: number
}

export interface SubmitSeriesResponse {
  id: string
  status: string
}

export interface SeriesSummaryUser {
  id: string
  name: string
  email: string
}

export interface SeriesSummaryManuscript {
  id: string
  version: number
  status: string
  reviewNote?: string
  uploadedBy: SeriesSummaryUser | null
  file: {
    id: string
    originalName: string
    mimeType: string
    size: number
    createdAt: string
  } | null
  createdAt: string
  updatedAt: string
}

export interface SeriesSummaryChapter {
  id: string
  chapterNumber: number
  title: string
  status: string
  draftSchedule?: string
  pageCount: number
  approvedPages: number
  updatedAt: string
}

export interface SeriesSummary {
  series: SeriesDraft
  owner: SeriesSummaryUser | null
  members: Array<{
    id: string
    role: string
    isActive: boolean
    accessScope: string
    user: (SeriesSummaryUser & { role: string }) | null
  }>
  manuscripts: SeriesSummaryManuscript[]
  currentManuscript: SeriesSummaryManuscript | null
  chapters: SeriesSummaryChapter[]
  currentChapter: SeriesSummaryChapter | null
  chapterSummary: {
    total: number
    completed: number
    inProduction: number
    totalPages: number
    approvedPages: number
    readinessPercent: number
  }
  taskSummary: {
    total: number
    pending: number
    completed: number
    pendingReviews: number
  }
  recentTasks: Array<{
    id: string
    title: string
    status: string
    priority: string
    dueDate: string
    assignee: string | null
  }>
  recentSubmissions: Array<{
    id: string
    version: number
    status: string
    submittedBy: string | null
    createdAt: string
  }>
  commentSummary: { open: number; resolved: number; blocking: number }
  recentComments: Array<{
    id: string
    body: string
    status: string
    isBlocking: boolean
    author: string | null
    authorRole?: string
    updatedAt: string
  }>
  boardReview: {
    status: string
    result?: string
    voteCount: number
    updatedAt: string
  } | null
  publicationSummary: {
    isReady: boolean
    scheduled: number
    published: number
    blockers: string[]
  }
  rankingSummary: {
    period: string
    voteCount: number
    readerScore: number
    finalScore: number
    status: string
  } | null
  payrollSummary: { totalEarnings: number; unpaid: number }
  allowedActions: {
    canEditSeries: boolean
    canUploadManuscript: boolean
    canOpenWorkspace: boolean
  }
}

// ==================== API CALLS ====================

export const seriesApi = {
  list: () =>
    apiClient.get<ApiResponse<SeriesListResponse>>("/series"),

  create: (input: CreateSeriesInput) =>
    apiClient.post<ApiResponse<SeriesDraft>>("/series", input),

  update: (seriesId: string, input: UpdateSeriesInput) =>
    apiClient.patch<ApiResponse<SeriesDraft>>(`/series/${seriesId}`, input),

  get: (seriesId: string) =>
    apiClient.get<ApiResponse<SeriesDraft>>(`/series/${seriesId}`),

  getSummary: (seriesId: string) =>
    apiClient.get<ApiResponse<SeriesSummary>>(`/series/${seriesId}/summary`),

  createManuscriptUpload: (seriesId: string, input: CreateManuscriptUploadInput) =>
    apiClient.post<ApiResponse<CreateManuscriptUploadResponse>>(
      `/series/${seriesId}/manuscripts/uploads`,
      input,
    ),

  submit: (seriesId: string) =>
    apiClient.post<ApiResponse<SubmitSeriesResponse>>(`/series/${seriesId}/submit`),
}

// ==================== UPLOAD HELPER ====================

/**
 * PUT a File/Blob directly to the presigned R2/S3 URL produced by
 * createManuscriptUpload. This call MUST NOT use the apiClient (different host,
 * no Authorization header expected).
 */
export async function putToPresignedUrl(
  uploadUrl: string,
  file: File,
  onProgress?: (loaded: number, total: number) => void,
): Promise<void> {
  await axios.put(uploadUrl, file, {
    headers: { "Content-Type": file.type },
    onUploadProgress: (event) => {
      if (onProgress && event.total) onProgress(event.loaded, event.total)
    },
  })
}
