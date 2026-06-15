import { AppError } from "../../shared/errors/AppError.js";
export async function createCommentService(input) {
    if (!input.body?.trim()) {
        throw new AppError("Comment body is required", 400);
    }
    const { createCommentService } = await import("./services/comment-query.service.js");
    return createCommentService(input);
}
export { markCommentFixedService, verifyCommentFixedService, resolveCommentService, reopenCommentService } from "./services/comment-command.service.js";
export { hasBlockingUnresolvedCommentsService, listCommentsByTaskService } from "./services/comment-query.service.js";
//# sourceMappingURL=comment.service.js.map