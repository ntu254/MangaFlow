import { apiRequest } from "@/shared/api/client"

export interface SubmissionReviewResult {
  id?: string
  _id?: string
  taskId: string
  seriesId: string
  chapterId: string
  pageId?: string
  regionId?: string
  submittedBy: string | { name?: string; role?: string }
  version: number
  status: string
  resultText?: string
  fileAssetId?: string | { originalName?: string }
  reviewerNote?: string
  createdAt: string
  updatedAt: string
}

interface ReviewActionInput {
  submissionId: string
  reviewerNote?: string
}

function reviewAction(path: string, reviewerNote?: string) {
  return apiRequest<SubmissionReviewResult>(path, {
    method: "POST",
    body: JSON.stringify({ reviewerNote }),
  })
}

export function mangakaApproveSubmission(input: ReviewActionInput) {
  return reviewAction(`/submissions/${input.submissionId}/mangaka-approve`, input.reviewerNote)
}

export function requestSubmissionRevision(input: ReviewActionInput) {
  return reviewAction(`/submissions/${input.submissionId}/request-revision`, input.reviewerNote)
}

export function rejectSubmission(input: ReviewActionInput) {
  return reviewAction(`/submissions/${input.submissionId}/reject`, input.reviewerNote)
}

export function editorApproveSubmission(input: ReviewActionInput) {
  return reviewAction(`/submissions/${input.submissionId}/editor-approve`, input.reviewerNote)
}

export function listReviewQueueSubmissions() {
  return apiRequest<SubmissionReviewResult[]>("/submissions/review-queue")
}
