import { Comment } from "../../comment/comment.model.js";
import { Submission } from "../../submission/submission.model.js";
import { Task } from "../../task/task.model.js";
import { Chapter, Page } from "../chapter.model.js";
export async function getChapterReadinessData(chapterId) {
    const chapter = await Chapter.findById(chapterId).lean();
    if (!chapter)
        return null;
    const [pages, tasks, submissions, blockingComments] = await Promise.all([
        Page.find({ chapterId }).sort({ pageNumber: 1 }).lean(),
        Task.find({ chapterId }).lean(),
        Submission.find({ chapterId }).sort({ createdAt: -1 }).lean(),
        Comment.find({ chapterId, isBlocking: true, status: { $ne: "RESOLVED_BY_EDITOR" } }).lean(),
    ]);
    return { chapter, pages, tasks, submissions, blockingComments };
}
//# sourceMappingURL=readiness.repository.js.map