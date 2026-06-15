import type { CommentActor } from "./policies/comment-access.policy.js";
export type { CommentActor };
export interface CreateCommentServiceInput {
    actor: CommentActor;
    seriesId: string;
    chapterId?: string;
    pageId?: string;
    regionId?: string;
    taskId?: string;
    submissionId?: string;
    body: string;
    isBlocking?: boolean;
}
export declare function createCommentService(input: CreateCommentServiceInput): Promise<import("mongoose").Document<unknown, {}, import("./comment.model.js").CommentDocument, {}, {}> & import("./comment.model.js").CommentDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
export { markCommentFixedService, verifyCommentFixedService, resolveCommentService, reopenCommentService } from "./services/comment-command.service.js";
export { hasBlockingUnresolvedCommentsService, listCommentsByTaskService } from "./services/comment-query.service.js";
//# sourceMappingURL=comment.service.d.ts.map