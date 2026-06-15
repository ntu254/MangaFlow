import { type CommentActor } from "../policies/comment-access.policy.js";
export declare function markCommentFixedService(commentId: string, actor: CommentActor): Promise<(import("mongoose").Document<unknown, {}, import("../comment.model.js").CommentDocument, {}, {}> & import("../comment.model.js").CommentDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export declare function verifyCommentFixedService(commentId: string, actor: CommentActor): Promise<(import("mongoose").Document<unknown, {}, import("../comment.model.js").CommentDocument, {}, {}> & import("../comment.model.js").CommentDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export declare function resolveCommentService(commentId: string, actor: CommentActor): Promise<(import("mongoose").Document<unknown, {}, import("../comment.model.js").CommentDocument, {}, {}> & import("../comment.model.js").CommentDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export declare function reopenCommentService(commentId: string, actor: CommentActor): Promise<(import("mongoose").Document<unknown, {}, import("../comment.model.js").CommentDocument, {}, {}> & import("../comment.model.js").CommentDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
//# sourceMappingURL=comment-command.service.d.ts.map