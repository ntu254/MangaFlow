import { apiClient } from "@/shared/lib/axios"
import type { ApiResponse } from "@/shared/types"

export type ChapterStatus =
  | "DRAFT"
  | "IN_PRODUCTION"
  | "IN_REVIEW"
  | "READY_FOR_PUBLICATION"
  | "PUBLISHED"
  | "REVISION_REQUIRED"

export type PageStatus =
  | "UPLOADING"
  | "UPLOADED"
  | "PROCESSING_FAILED"
  | "IN_PROGRESS"
  | "UNDER_REVIEW"
  | "APPROVED"

export type RegionType = "PANEL" | "BUBBLE" | "SFX" | "AREA" | "OTHER"
export type RegionStatus = "CREATED" | "AI_SUGGESTED" | "ACCEPTED" | "REJECTED" | "LINKED_TO_TASK" | "ARCHIVED"
export type AIResultStatus = "PENDING" | "COMPLETED" | "FAILED" | "PARTIALLY_ACCEPTED"

export interface Chapter {
  id: string
  seriesId: string
  chapterNumber: number
  title: string
  status: ChapterStatus
  publicationTypeSnapshot?: string
  draftSchedule?: string
  createdAt: string
  updatedAt: string
}

export interface FileAssetRef {
  id: string
  originalName: string
  mimeType: string
  size: number
  r2Key: string
}

export type ActiveTaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "REVISION_REQUESTED"
  | "MANGAKA_APPROVED"

export interface Page {
  id: string
  chapterId: string
  pageNumber: number
  status: PageStatus
  originalFileAssetId?: string
  workingFileAssetId?: string
  thumbnailFileAssetId?: string
  regionIds: string[]
  activeTask?: {
    id: string
    status: ActiveTaskStatus
    assignedTo?: { id: string; name: string }
    taskType?: { id: string; name: string }
    currentSubmissionId?: string
    revisionRequestedByRole?: "MANGAKA" | "EDITOR"
    revisionFeedback?: {
      submissionId: string
      version: number
      reviewerNote: string
      reviewerRole: "MANGAKA" | "EDITOR"
    }
  }
  createdAt: string
  updatedAt: string
}

export interface PageWithAssets extends Page {
  originalAsset?: FileAssetRef
  workingAsset?: FileAssetRef
  thumbnailAsset?: FileAssetRef
}

export interface Region {
  id: string
  pageId: string
  regionIndex: number
  type: RegionType
  bbox: { x: number; y: number; width: number; height: number }
  status: RegionStatus
  source: "MANUAL" | "AI"
  aiResultId?: string
  confidence?: number
  createdAt: string
  updatedAt: string
}

export interface AISuggestion {
  suggestionIndex: number
  type: RegionType
  bbox: { x: number; y: number; width: number; height: number }
  confidence?: number
  decision: "PENDING" | "ACCEPTED" | "REJECTED"
  regionId?: string
}

export interface AIResult {
  id: string
  pageId: string
  workingFileAssetId?: string
  status: AIResultStatus
  modelName?: string
  suggestions: AISuggestion[]
  error?: string
  requestedBy: string
  createdAt: string
  updatedAt: string
}

export interface PresignedUploadResponse {
  uploadUrl: string
  r2Key: string
  expiresIn: number
}

export interface UploadAssetInput {
  fileAssetId: string
  r2Key: string
  originalName: string
  mimeType: string
  size: number
}

export interface ConfirmPageUploadInput {
  original: UploadAssetInput
  working: UploadAssetInput
  thumbnail: UploadAssetInput
}

export interface ConfirmPageUploadResponse {
  page: Page
  originalAsset: FileAssetRef
  workingAsset: FileAssetRef
  thumbnailAsset: FileAssetRef
}

export interface PageStudioResponse {
  page: Page
  workingFileAsset?: FileAssetRef
  originalFileAsset?: FileAssetRef
  thumbnailFileAsset?: FileAssetRef
  regions: Region[]
  aiResults: AIResult[]
  tasks: Array<{ id: string; title: string; status: string; assignedTo?: string }>
  feedbackPoints: unknown[]
  collaborators: unknown[]
}

export const chapterApi = {
  create: (input: { seriesId: string; chapterNumber: number; title: string }) =>
    apiClient.post<ApiResponse<Chapter>>("/chapters", input),

  listBySeries: (seriesId: string) =>
    apiClient.get<ApiResponse<Chapter[]>>(`/chapters/series/${seriesId}`),

  get: (chapterId: string) =>
    apiClient.get<ApiResponse<Chapter>>(`/chapters/${chapterId}`),

  updateStatus: (chapterId: string, status: ChapterStatus) =>
    apiClient.patch<ApiResponse<Chapter>>(`/chapters/${chapterId}/status`, { status }),

  createPage: (chapterId: string, pageNumber: number) =>
    apiClient.post<ApiResponse<Page>>(`/chapters/${chapterId}/pages`, { pageNumber }),

  listPages: (chapterId: string) =>
    apiClient.get<ApiResponse<Page[]>>(`/chapters/${chapterId}/pages`),
}

export const fileApi = {
  getPresignedUploadUrl: (input: {
    originalName: string
    contentType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf"
    expiresIn?: number
  }) =>
    apiClient.post<ApiResponse<PresignedUploadResponse>>("/files/presigned-upload", input),

  confirmPageUpload: (pageId: string, input: ConfirmPageUploadInput) =>
    apiClient.post<ApiResponse<ConfirmPageUploadResponse>>(
      `/files/pages/${pageId}/confirm-upload`,
      input,
    ),

  getPresignedDownloadUrl: (fileAssetId: string, expiresIn?: number) =>
    apiClient.get<ApiResponse<{ downloadUrl: string; expiresIn: number }>>(
      `/files/files/${fileAssetId}/presigned-download`,
      expiresIn ? { params: { expiresIn } } : undefined,
    ),

  getPageWithAssets: (pageId: string) =>
    apiClient.get<ApiResponse<PageWithAssets>>(`/files/pages/${pageId}`),
}

export const regionApi = {
  create: (
    pageId: string,
    input: {
      type?: RegionType
      bbox: { x: number; y: number; width: number; height: number }
    },
  ) =>
    apiClient.post<ApiResponse<Region>>(`/files/pages/${pageId}/regions`, input),

  listByPage: (pageId: string) =>
    apiClient.get<ApiResponse<Region[]>>(`/files/pages/${pageId}/regions`),

  get: (regionId: string) =>
    apiClient.get<ApiResponse<Region>>(`/files/regions/${regionId}`),

  update: (
    regionId: string,
    patch: {
      type?: RegionType
      bbox?: { x: number; y: number; width: number; height: number }
    },
  ) =>
    apiClient.patch<ApiResponse<Region>>(`/files/regions/${regionId}`, patch),

  delete: (regionId: string) =>
    apiClient.delete<ApiResponse<Region>>(`/files/regions/${regionId}`),
}

export const aiApi = {
  segment: (pageId: string) =>
    apiClient.post<ApiResponse<AIResult>>(`/files/pages/${pageId}/ai/segment`),

  listResults: (pageId: string) =>
    apiClient.get<ApiResponse<AIResult[]>>(`/files/pages/${pageId}/ai-results`),

  acceptSuggestion: (aiResultId: string, suggestionIndex: number) =>
    apiClient.post<ApiResponse<{ aiResult: AIResult; region: Region }>>(
      `/files/ai-results/${aiResultId}/accept-region`,
      { suggestionIndex },
    ),

  rejectSuggestion: (aiResultId: string, suggestionIndex: number) =>
    apiClient.post<ApiResponse<AIResult>>(
      `/files/ai-results/${aiResultId}/reject-region`,
      { suggestionIndex },
    ),
}

export const pageApi = {
  getStudio: (pageId: string) =>
    apiClient.get<ApiResponse<PageStudioResponse>>(`/pages/${pageId}/studio`),
}
