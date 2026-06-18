import { apiClient } from "@/shared/lib/axios"
import type { ApiResponse } from "@/shared/types"

// ── Types ─────────────────────────────────────────────────────────────────────

export type SubmissionStatus =
  | "SUBMITTED"
  | "REVISION_REQUESTED"
  | "MANGAKA_APPROVED"
  | "EDITOR_APPROVED"
  | "REJECTED"

export interface Submission {
  id: string
  taskId: string
  seriesId: string
  chapterId: string
  pageId?: string
  regionId?: string
  submittedBy: string | { id: string; name: string; role: string }
  version: number
  resultText?: string
  fileAssetId?: string | { id: string; originalName: string }
  status: SubmissionStatus
  reviewerNote?: string
  createdAt: string
  updatedAt: string
}

export interface ReviewQueueItem {
  id: string
  taskId: string
  seriesId: string
  chapterId: string
  pageId?: string
  version: number
  status: SubmissionStatus
  submittedBy: { id: string; name: string; role: string } | null
  fileAssetId?: { id: string; originalName: string } | null
  updatedAt: string
}

export interface SubmitTaskInput {
  resultText?: string
  fileAssetId?: string
}

export interface ReviewActionInput {
  reviewerNote?: string
}

// ── Submission API ─────────────────────────────────────────────────────────────

export const submissionApi = {
  /**
   * Flow-05: Assistant submits work for an assigned task.
   * Creates a new version — does not overwrite previous submissions.
   */
  create: (taskId: string, input: SubmitTaskInput) =>
    apiClient.post<ApiResponse<Submission>>(`/tasks/${taskId}/submissions`, input),

  getUploadUrl: (taskId: string, input: { originalName: string; contentType: string; size: number }) =>
    apiClient.post<ApiResponse<{ uploadUrl: string; fileAssetId: string }>>(
      `/tasks/${taskId}/submissions/upload-url`,
      input,
    ),

  listByTask: (taskId: string) =>
    apiClient.get<ApiResponse<Submission[]>>(`/tasks/${taskId}/submissions`),

  /**
   * Flow-06/07: Review queue.
   * MANGAKA sees SUBMITTED tasks across their series.
   * EDITOR sees MANGAKA_APPROVED tasks across their series.
   */
  reviewQueue: () =>
    apiClient.get<ApiResponse<ReviewQueueItem[]>>("/submissions/review-queue"),

  // ── Flow-06: Mangaka actions ────────────────────────────────────────────────

  /** Approve the current submission (must be SUBMITTED). */
  mangakaApprove: (submissionId: string, input?: ReviewActionInput) =>
    apiClient.post<ApiResponse<Submission>>(
      `/submissions/${submissionId}/mangaka-approve`,
      input ?? {},
    ),

  /**
   * Request revision. Feedback is mandatory.
   * MANGAKA can revision SUBMITTED; EDITOR can revision MANGAKA_APPROVED.
   */
  requestRevision: (submissionId: string, reviewerNote: string) =>
    apiClient.post<ApiResponse<Submission>>(
      `/submissions/${submissionId}/request-revision`,
      { reviewerNote },
    ),

  /** Flow-06: Mangaka rejects SUBMITTED work. */
  reject: (submissionId: string, input?: ReviewActionInput) =>
    apiClient.post<ApiResponse<Submission>>(
      `/submissions/${submissionId}/reject`,
      input ?? {},
    ),

  // ── Flow-07: Editor final review actions ────────────────────────────────────

  /** Flow-07: Editor final-approves MANGAKA_APPROVED work. Auto-triggers earning candidate. */
  editorApprove: (submissionId: string, input?: ReviewActionInput) =>
    apiClient.post<ApiResponse<Submission>>(
      `/submissions/${submissionId}/editor-approve`,
      input ?? {},
    ),

  /** Flow-07: Editor rejects MANGAKA_APPROVED work — requires a reason. */
  editorReject: (submissionId: string, reviewerNote: string) =>
    apiClient.post<ApiResponse<Submission>>(
      `/submissions/${submissionId}/editor-reject`,
      { reviewerNote },
    ),
}
