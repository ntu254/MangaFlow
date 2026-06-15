import { Chapter, Page, Region } from "../chapter/chapter.model.js";
import { Submission } from "../submission/submission.model.js";
import { Task } from "../task/task.model.js";
import { Comment } from "./comment.model.js";
export async function getTaskForComment(taskId) {
    return Task.findById(taskId);
}
export async function getSubmissionForComment(submissionId) {
    return Submission.findById(submissionId);
}
export async function getChapterForComment(chapterId) {
    return Chapter.findById(chapterId);
}
export async function getPageForComment(pageId) {
    return Page.findById(pageId);
}
export async function getRegionForComment(regionId) {
    return Region.findById(regionId);
}
export async function createCommentRecord(input) {
    return Comment.create({
        seriesId: input.seriesId,
        chapterId: input.chapterId,
        pageId: input.pageId,
        regionId: input.regionId,
        taskId: input.taskId,
        submissionId: input.submissionId,
        authorId: input.authorId,
        body: input.body,
        isBlocking: input.isBlocking ?? true,
        status: "OPEN",
    });
}
export async function getCommentById(commentId) {
    return Comment.findById(commentId);
}
export async function listCommentsByTask(taskId) {
    return Comment.find({ taskId }).sort({ createdAt: -1 }).populate("authorId", "name role").lean();
}
export async function updateCommentStatus(commentId, status, actorField, actorId) {
    const update = { status, [actorField]: actorId };
    if (status === "OPEN") {
        update.fixedBy = undefined;
        update.verifiedBy = undefined;
        update.resolvedBy = undefined;
    }
    return Comment.findByIdAndUpdate(commentId, update, { new: true });
}
export async function countBlockingUnresolvedComments(filter) {
    const query = {
        isBlocking: true,
        status: { $ne: "RESOLVED_BY_EDITOR" },
    };
    if (filter.seriesId)
        query.seriesId = filter.seriesId;
    if (filter.chapterId)
        query.chapterId = filter.chapterId;
    if (filter.taskId)
        query.taskId = filter.taskId;
    return Comment.countDocuments(query);
}
//# sourceMappingURL=comment.repository.js.map