import { type CommentActor } from "../policies/comment-access.policy.js";
import type { CreateCommentServiceInput } from "../comment.service.js";
export declare function createCommentService(input: CreateCommentServiceInput): Promise<import("mongoose").Document<unknown, {}, import("../comment.model.js").CommentDocument, {}, {}> & import("../comment.model.js").CommentDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
export declare function hasBlockingUnresolvedCommentsService(filter: {
    seriesId?: string;
    chapterId?: string;
    taskId?: string;
}): Promise<boolean>;
export declare function listCommentsByTaskService(taskId: string, actor: CommentActor): Promise<(import("mongoose").FlattenMaps<import("../comment.model.js").CommentDocument> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
})[]>;
//# sourceMappingURL=comment-query.service.d.ts.map