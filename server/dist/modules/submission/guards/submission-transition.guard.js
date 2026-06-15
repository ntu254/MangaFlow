import { AppError } from "../../../shared/errors/AppError.js";
export function assertSubmissionPayload(input) {
    if (!input.resultText?.trim() && !input.fileAssetId) {
        throw new AppError("Submission requires text result or file asset", 400);
    }
}
export function assertTaskSubmittable(status) {
    if (!["TODO", "IN_PROGRESS", "REVISION_REQUESTED"].includes(status)) {
        throw new AppError(`Task cannot be submitted from status ${status}`, 409);
    }
}
export function assertMangakaApprovalState(submissionStatus, taskStatus) {
    if (submissionStatus !== "SUBMITTED" || taskStatus !== "SUBMITTED") {
        throw new AppError("Mangaka approval requires submitted work", 409);
    }
}
export function assertEditorApprovalState(submissionStatus, taskStatus) {
    if (submissionStatus !== "MANGAKA_APPROVED" || taskStatus !== "MANGAKA_APPROVED") {
        throw new AppError("Editor final approval requires Mangaka approval first", 409);
    }
}
export function assertRejectState(submissionStatus, taskStatus) {
    if (submissionStatus !== "SUBMITTED" || taskStatus !== "SUBMITTED") {
        throw new AppError("Rejection requires submitted work before Mangaka approval", 409);
    }
}
//# sourceMappingURL=submission-transition.guard.js.map