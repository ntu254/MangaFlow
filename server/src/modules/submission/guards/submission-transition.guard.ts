import { AppError } from "../../../shared/errors/AppError.js"

export function assertSubmissionPayload(input: { resultText?: string; fileAssetId?: string }) {
  if (!input.resultText?.trim() && !input.fileAssetId) {
    throw new AppError("Submission requires text result or file asset", 400)
  }
}

export function assertTaskSubmittable(status: string) {
  if (!["TODO", "IN_PROGRESS", "REVISION_REQUESTED"].includes(status)) {
    throw new AppError(`Task cannot be submitted from status ${status}`, 409)
  }
}

export function assertMangakaApprovalState(submissionStatus: string, taskStatus: string) {
  if (submissionStatus !== "SUBMITTED" || taskStatus !== "SUBMITTED") {
    throw new AppError("Mangaka approval requires submitted work", 409)
  }
}

export function assertEditorApprovalState(submissionStatus: string, taskStatus: string) {
  if (submissionStatus !== "MANGAKA_APPROVED" || taskStatus !== "MANGAKA_APPROVED") {
    throw new AppError("Editor final approval requires Mangaka approval first", 409)
  }
}

/**
 * Flow-06: Mangaka can reject SUBMITTED work.
 * Flow-07: Editor can reject MANGAKA_APPROVED work.
 */
export function assertMangakaRejectState(submissionStatus: string, taskStatus: string) {
  if (submissionStatus !== "SUBMITTED" || taskStatus !== "SUBMITTED") {
    throw new AppError("Mangaka rejection requires submitted work before Mangaka approval", 409)
  }
}

export function assertEditorRejectState(submissionStatus: string, taskStatus: string) {
  if (submissionStatus !== "MANGAKA_APPROVED" || taskStatus !== "MANGAKA_APPROVED") {
    throw new AppError("Editor rejection requires Mangaka-approved work", 409)
  }
}

/** Flow-06/07: revision feedback is mandatory. */
export function assertRevisionFeedback(reviewerNote: string | undefined) {
  if (!reviewerNote?.trim()) {
    throw new AppError("Revision feedback is required when requesting revision", 400)
  }
}
