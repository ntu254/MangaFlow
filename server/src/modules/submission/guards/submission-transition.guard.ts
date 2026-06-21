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
    if (submissionStatus === "REVISION_REQUESTED") {
      throw new AppError("Cannot review a submission that is awaiting revision. A new submission must be created first.", 409)
    }
    if (submissionStatus === "MANGAKA_APPROVED" || submissionStatus === "EDITOR_APPROVED") {
      throw new AppError("This submission has already been approved. Cannot review again.", 409)
    }
    if (submissionStatus === "REJECTED") {
      throw new AppError("This submission has been rejected and cannot be reviewed further.", 409)
    }
    throw new AppError("Mangaka approval requires submitted work", 409)
  }
}

export function assertEditorApprovalState(submissionStatus: string, taskStatus: string) {
  if (submissionStatus !== "MANGAKA_APPROVED" || taskStatus !== "MANGAKA_APPROVED") {
    if (submissionStatus === "REVISION_REQUESTED") {
      throw new AppError("Cannot review a submission that is awaiting revision. A new submission must be created first.", 409)
    }
    if (submissionStatus === "EDITOR_APPROVED") {
      throw new AppError("This submission has already been approved by Editor.", 409)
    }
    if (submissionStatus === "REJECTED") {
      throw new AppError("This submission has been rejected and cannot be reviewed further.", 409)
    }
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
