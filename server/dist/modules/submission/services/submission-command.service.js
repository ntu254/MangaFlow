import { AppError } from "../../../shared/errors/AppError.js";
import { updateSubmissionStatus, updateTaskStatusForSubmission } from "../submission.repository.js";
import { assertSubmissionSeriesMember } from "../policies/submission-access.policy.js";
import { assertEditorApprovalState, assertMangakaApprovalState, assertRejectState, } from "../guards/submission-transition.guard.js";
import { getSubmissionWithTask } from "./submission.shared.js";
export async function mangakaApproveSubmissionService(input) {
    const { submission, task } = await getSubmissionWithTask(input.submissionId);
    await assertSubmissionSeriesMember(String(task.seriesId), input.actor, ["MANGAKA"]);
    assertMangakaApprovalState(submission.status, task.status);
    const updated = await updateSubmissionStatus(input.submissionId, "MANGAKA_APPROVED", input.reviewerNote);
    await updateTaskStatusForSubmission(String(task._id), "MANGAKA_APPROVED");
    return updated;
}
export async function editorApproveSubmissionService(input) {
    const { submission, task } = await getSubmissionWithTask(input.submissionId);
    await assertSubmissionSeriesMember(String(task.seriesId), input.actor, ["EDITOR"]);
    assertEditorApprovalState(submission.status, task.status);
    const updated = await updateSubmissionStatus(input.submissionId, "EDITOR_APPROVED", input.reviewerNote);
    await updateTaskStatusForSubmission(String(task._id), "EDITOR_APPROVED");
    return updated;
}
export async function requestSubmissionRevisionService(input) {
    const { submission, task } = await getSubmissionWithTask(input.submissionId);
    if (submission.status === "SUBMITTED") {
        await assertSubmissionSeriesMember(String(task.seriesId), input.actor, ["MANGAKA"]);
    }
    else if (submission.status === "MANGAKA_APPROVED") {
        await assertSubmissionSeriesMember(String(task.seriesId), input.actor, ["EDITOR"]);
    }
    else {
        throw new AppError("Revision can be requested only during review", 409);
    }
    const updated = await updateSubmissionStatus(input.submissionId, "REVISION_REQUESTED", input.reviewerNote);
    await updateTaskStatusForSubmission(String(task._id), "REVISION_REQUESTED");
    return updated;
}
export async function rejectSubmissionService(input) {
    const { submission, task } = await getSubmissionWithTask(input.submissionId);
    await assertSubmissionSeriesMember(String(task.seriesId), input.actor, ["MANGAKA"]);
    assertRejectState(submission.status, task.status);
    const updated = await updateSubmissionStatus(input.submissionId, "REJECTED", input.reviewerNote);
    await updateTaskStatusForSubmission(String(task._id), "REJECTED");
    return updated;
}
//# sourceMappingURL=submission-command.service.js.map