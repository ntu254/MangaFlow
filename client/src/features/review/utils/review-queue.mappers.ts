import type {
  ActionItem,
  SubmissionVersionItem,
} from "@/shared/components/domain"
import type { SubmissionReviewResult } from "../api/review.api"

export interface ReviewQueueRow {
  id: string
  target: string
  series: string
  type: string
  status: string
  owner: string
  age: string
}

export function submissionId(submission: SubmissionReviewResult) {
  return submission.id ?? submission._id ?? `${submission.taskId}-${submission.version}`
}

export function submittedByLabel(submission: SubmissionReviewResult) {
  return typeof submission.submittedBy === "string"
    ? `Assistant ${String(submission.submittedBy).slice(-6)}`
    : submission.submittedBy.name ?? "Assistant"
}

export function fileLabel(submission: SubmissionReviewResult) {
  if (!submission.fileAssetId) return undefined
  return typeof submission.fileAssetId === "string" ? "File linked" : submission.fileAssetId.originalName
}

export function toReviewRows(submissions: SubmissionReviewResult[]): ReviewQueueRow[] {
  return submissions.map((submission) => ({
    id: submissionId(submission),
    target: `Submission v${submission.version}`,
    series: `Series ${String(submission.seriesId).slice(-6)}`,
    type: submission.status === "MANGAKA_APPROVED" ? "Editor final approval" : "Mangaka review",
    status: submission.status,
    owner: submission.status === "MANGAKA_APPROVED" ? "Editor final review" : "Mangaka review",
    age: new Date(submission.updatedAt ?? submission.createdAt).toLocaleDateString(),
  }))
}

export function toReviewActions(submissions: SubmissionReviewResult[]): ActionItem[] {
  if (submissions.length === 0) {
    return [{
      id: "review-empty-action",
      title: "No live review actions",
      description: "Review items will appear after backend returns submissions for your role.",
      metadata: "GET /api/submissions/review-queue",
      icon: "rate_review",
      status: "SUBMITTED",
    }]
  }
  return submissions.slice(0, 3).map((submission) => ({
    id: submissionId(submission),
    title: `Review submission v${submission.version}`,
    description: submission.resultText ?? "Submission is waiting for review.",
    metadata: `${submission.status} - task ${String(submission.taskId).slice(-6)}`,
    icon: "rate_review",
    status: submission.status,
  }))
}

export function toSubmissionVersions(submissions: SubmissionReviewResult[]): SubmissionVersionItem[] {
  return submissions.slice(0, 3).map((submission, index) => ({
    id: submissionId(submission),
    label: `Version ${submission.version}`,
    submittedBy: submittedByLabel(submission),
    submittedAt: new Date(submission.createdAt).toLocaleDateString(),
    status: submission.status,
    summary: submission.resultText,
    fileName: fileLabel(submission),
    isCurrent: index === 0,
  }))
}
