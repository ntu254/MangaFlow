import { AppError } from "../../../shared/errors/AppError.js";
import { getChapterForComment, getPageForComment, getRegionForComment, getSubmissionForComment, getTaskForComment, } from "../comment.repository.js";
export async function normalizeCommentScope(input) {
    const scope = {
        seriesId: input.seriesId,
        chapterId: input.chapterId,
        pageId: input.pageId,
        regionId: input.regionId,
        taskId: input.taskId,
        submissionId: input.submissionId,
    };
    if (input.taskId) {
        const task = await getTaskForComment(input.taskId);
        if (!task)
            throw new AppError("Task not found", 404);
        if (String(task.seriesId) !== input.seriesId)
            throw new AppError("Task does not belong to the specified series", 400);
        if (input.chapterId && String(task.chapterId) !== input.chapterId) {
            throw new AppError("Task does not belong to the specified chapter", 400);
        }
        scope.chapterId = String(task.chapterId);
        if (task.pageId)
            scope.pageId = String(task.pageId);
        if (task.regionId)
            scope.regionId = String(task.regionId);
    }
    if (input.submissionId) {
        const submission = await getSubmissionForComment(input.submissionId);
        if (!submission)
            throw new AppError("Submission not found", 404);
        if (String(submission.seriesId) !== input.seriesId) {
            throw new AppError("Submission does not belong to the specified series", 400);
        }
        if (input.taskId && String(submission.taskId) !== input.taskId) {
            throw new AppError("Submission does not belong to the specified task", 400);
        }
        scope.taskId = String(submission.taskId);
        scope.chapterId = String(submission.chapterId);
        if (submission.pageId)
            scope.pageId = String(submission.pageId);
        if (submission.regionId)
            scope.regionId = String(submission.regionId);
    }
    if (scope.chapterId) {
        const chapter = await getChapterForComment(scope.chapterId);
        if (!chapter)
            throw new AppError("Chapter not found", 404);
        if (String(chapter.seriesId) !== input.seriesId) {
            throw new AppError("Chapter does not belong to the specified series", 400);
        }
    }
    if (scope.pageId) {
        const page = await getPageForComment(scope.pageId);
        if (!page)
            throw new AppError("Page not found", 404);
        if (scope.chapterId && String(page.chapterId) !== scope.chapterId) {
            throw new AppError("Page does not belong to the specified chapter", 400);
        }
        if (!scope.chapterId) {
            const chapter = await getChapterForComment(String(page.chapterId));
            if (!chapter)
                throw new AppError("Chapter not found", 404);
            if (String(chapter.seriesId) !== input.seriesId) {
                throw new AppError("Page does not belong to the specified series", 400);
            }
            scope.chapterId = String(page.chapterId);
        }
    }
    if (scope.regionId) {
        if (!scope.pageId)
            throw new AppError("Page ID is required when commenting on a region", 400);
        const region = await getRegionForComment(scope.regionId);
        if (!region)
            throw new AppError("Region not found", 404);
        if (String(region.pageId) !== scope.pageId) {
            throw new AppError("Region does not belong to the specified page", 400);
        }
    }
    return scope;
}
//# sourceMappingURL=comment-scope.service.js.map