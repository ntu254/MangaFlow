import { Task } from "../task/task.model.js";
import { Submission } from "./submission.model.js";
export async function getTaskForSubmission(taskId) {
    return Task.findById(taskId);
}
export async function getSubmissionById(submissionId) {
    return Submission.findById(submissionId);
}
export async function getLatestSubmissionForTask(taskId) {
    return Submission.findOne({ taskId }).sort({ version: -1 });
}
export async function createSubmissionRecord(input) {
    const task = await Task.findById(input.taskId);
    if (!task)
        return null;
    const latest = await getLatestSubmissionForTask(input.taskId);
    const version = latest ? latest.version + 1 : 1;
    return Submission.create({
        taskId: task._id,
        seriesId: task.seriesId,
        chapterId: task.chapterId,
        pageId: task.pageId,
        regionId: task.regionId,
        submittedBy: input.submittedBy,
        version,
        resultText: input.resultText,
        fileAssetId: input.fileAssetId,
        status: "SUBMITTED",
    });
}
export async function updateSubmissionStatus(submissionId, status, reviewerNote) {
    return Submission.findByIdAndUpdate(submissionId, { status, reviewerNote }, { new: true });
}
export async function updateTaskStatusForSubmission(taskId, status) {
    return Task.findByIdAndUpdate(taskId, { status }, { new: true });
}
export async function listSubmissionsByTask(taskId) {
    return Submission.find({ taskId })
        .sort({ version: -1 })
        .populate("submittedBy", "name role")
        .populate("fileAssetId", "originalName")
        .lean();
}
export async function listReviewQueueSubmissions(seriesIds, status) {
    return Submission.find({ seriesId: { $in: seriesIds }, status })
        .sort({ updatedAt: -1 })
        .populate("submittedBy", "name role")
        .populate("fileAssetId", "originalName")
        .lean();
}
//# sourceMappingURL=submission.repository.js.map