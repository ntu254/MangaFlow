import { AppError } from "../../../shared/errors/AppError.js";
import { createSubmissionRecord, getTaskForSubmission, listReviewQueueSubmissions, listSubmissionsByTask, updateTaskStatusForSubmission, } from "../submission.repository.js";
import { assertSubmissionSeriesMember } from "../policies/submission-access.policy.js";
import { assertSubmissionPayload, assertTaskSubmittable } from "../guards/submission-transition.guard.js";
export async function createTaskSubmissionService(input) {
    const task = await getTaskForSubmission(input.taskId);
    if (!task) {
        throw new AppError("Task not found", 404);
    }
    if (String(task.assignedTo) !== input.actor.userId) {
        throw new AppError("Assistant can submit only their assigned task", 403);
    }
    await assertSubmissionSeriesMember(String(task.seriesId), input.actor, ["ASSISTANT"]);
    assertTaskSubmittable(task.status);
    assertSubmissionPayload(input);
    const submission = await createSubmissionRecord({
        taskId: input.taskId,
        submittedBy: input.actor.userId,
        resultText: input.resultText,
        fileAssetId: input.fileAssetId,
    });
    if (!submission) {
        throw new AppError("Task not found", 404);
    }
    await updateTaskStatusForSubmission(input.taskId, "SUBMITTED");
    return submission;
}
export async function listTaskSubmissionsService(taskId, actor) {
    const task = await getTaskForSubmission(taskId);
    if (!task) {
        throw new AppError("Task not found", 404);
    }
    if (String(task.assignedTo) === actor.userId) {
        return listSubmissionsByTask(taskId);
    }
    await assertSubmissionSeriesMember(String(task.seriesId), actor, ["MANGAKA", "EDITOR"]);
    return listSubmissionsByTask(taskId);
}
export async function listReviewQueueSubmissionsService(actor) {
    if (!["MANGAKA", "EDITOR"].includes(actor.role)) {
        throw new AppError("Review queue access denied", 403);
    }
    const role = actor.role;
    const { SeriesMember } = await import("../../series/series.model.js");
    // Support both new status field (Flow-03) and legacy isActive boolean
    const members = await SeriesMember.find({
        userId: actor.userId,
        role,
        $or: [{ status: "ACTIVE" }, { isActive: true }],
    }).lean();
    const seriesIds = members.map((member) => String(member.seriesId));
    if (seriesIds.length === 0) {
        return [];
    }
    const status = role === "MANGAKA" ? "SUBMITTED" : "MANGAKA_APPROVED";
    return listReviewQueueSubmissions(seriesIds, status);
}
//# sourceMappingURL=submission-query.service.js.map