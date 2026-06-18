import { AppError } from "../../../shared/errors/AppError.js";
import { createSubmissionRecord, getTaskForSubmission, listReviewQueueSubmissions, listSubmissionsByTask, updateTaskStatusForSubmission, } from "../submission.repository.js";
import { assertSubmissionSeriesMember } from "../policies/submission-access.policy.js";
import { assertSubmissionPayload, assertTaskSubmittable } from "../guards/submission-transition.guard.js";
import { createPresignedUploadUrl } from "../../chapter/file.service.js";
import { FileAsset } from "../../chapter/chapter.model.js";
import { config } from "../../../shared/utils/env.js";
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
    const { ACTIVE_MEMBER_QUERY } = await import("../../../shared/policies/seriesMember.policy.js");
    const members = await SeriesMember.find({
        userId: actor.userId,
        role,
        ...ACTIVE_MEMBER_QUERY,
    }).lean();
    const seriesIds = members.map((member) => String(member.seriesId));
    if (seriesIds.length === 0) {
        return [];
    }
    const status = role === "MANGAKA" ? "SUBMITTED" : "MANGAKA_APPROVED";
    return listReviewQueueSubmissions(seriesIds, status);
}
export async function getTaskUploadUrlService(input) {
    const task = await getTaskForSubmission(input.taskId);
    if (!task) {
        throw new AppError("Task not found", 404);
    }
    if (String(task.assignedTo) !== input.actor.userId) {
        throw new AppError("Only assignee can upload task results", 403);
    }
    assertTaskSubmittable(task.status);
    const signed = await createPresignedUploadUrl(input.originalName, input.contentType);
    const fileAsset = await FileAsset.create({
        originalName: input.originalName,
        mimeType: input.contentType,
        size: input.size,
        r2Key: signed.r2Key,
        r2Bucket: config.r2Bucket,
        uploadedBy: input.actor.userId,
        assetType: "PRODUCTION",
    });
    return {
        uploadUrl: signed.uploadUrl,
        fileAssetId: fileAsset.id,
    };
}
//# sourceMappingURL=submission-query.service.js.map