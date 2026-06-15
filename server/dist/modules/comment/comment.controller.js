import { createCommentService, listCommentsByTaskService, markCommentFixedService, reopenCommentService, resolveCommentService, verifyCommentFixedService, } from "./comment.service.js";
export async function createComment(req, res) {
    const comment = await createCommentService({
        actor: req.user,
        seriesId: req.body.seriesId,
        chapterId: req.body.chapterId,
        pageId: req.body.pageId,
        regionId: req.body.regionId,
        taskId: req.body.taskId,
        submissionId: req.body.submissionId,
        body: req.body.body,
        isBlocking: req.body.isBlocking,
    });
    res.status(201).json({ success: true, message: "Comment created", data: comment });
}
export async function markCommentFixed(req, res) {
    const comment = await markCommentFixedService(String(req.params.id), req.user);
    res.json({ success: true, message: "Comment marked fixed", data: comment });
}
export async function verifyCommentFixed(req, res) {
    const comment = await verifyCommentFixedService(String(req.params.id), req.user);
    res.json({ success: true, message: "Comment fix verified", data: comment });
}
export async function resolveComment(req, res) {
    const comment = await resolveCommentService(String(req.params.id), req.user);
    res.json({ success: true, message: "Comment resolved", data: comment });
}
export async function reopenComment(req, res) {
    const comment = await reopenCommentService(String(req.params.id), req.user);
    res.json({ success: true, message: "Comment reopened", data: comment });
}
export async function listTaskComments(req, res) {
    const comments = await listCommentsByTaskService(req.params.taskId, req.user);
    res.json({
        success: true,
        message: "Comments retrieved successfully",
        data: comments,
    });
}
//# sourceMappingURL=comment.controller.js.map