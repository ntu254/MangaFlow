import type { CommentStatus } from "../../shared/workflow/status.js";
export interface CreateCommentRecordInput {
    seriesId: string;
    chapterId?: string;
    pageId?: string;
    regionId?: string;
    taskId?: string;
    submissionId?: string;
    authorId: string;
    body: string;
    isBlocking?: boolean;
}
export declare function getTaskForComment(taskId: string): Promise<(import("mongoose").Document<unknown, {}, import("../task/task.model.js").TaskDocument, {}, {}> & import("../task/task.model.js").TaskDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export declare function getSubmissionForComment(submissionId: string): Promise<(import("mongoose").Document<unknown, {}, import("../submission/submission.model.js").SubmissionDocument, {}, {}> & import("../submission/submission.model.js").SubmissionDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export declare function getChapterForComment(chapterId: string): Promise<(import("mongoose").Document<unknown, {}, import("../chapter/chapter.model.js").ChapterDocument, {}, {}> & import("../chapter/chapter.model.js").ChapterDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export declare function getPageForComment(pageId: string): Promise<(import("mongoose").Document<unknown, {}, import("../chapter/chapter.model.js").PageDocument, {}, {}> & import("../chapter/chapter.model.js").PageDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export declare function getRegionForComment(regionId: string): Promise<(import("mongoose").Document<unknown, {}, import("../chapter/chapter.model.js").RegionDocument, {}, {}> & import("../chapter/chapter.model.js").RegionDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export declare function createCommentRecord(input: CreateCommentRecordInput): Promise<import("mongoose").Document<unknown, {}, import("./comment.model.js").CommentDocument, {}, {}> & import("./comment.model.js").CommentDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
export declare function getCommentById(commentId: string): Promise<(import("mongoose").Document<unknown, {}, import("./comment.model.js").CommentDocument, {}, {}> & import("./comment.model.js").CommentDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export declare function listCommentsByTask(taskId: string): Promise<(import("mongoose").FlattenMaps<import("./comment.model.js").CommentDocument> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
})[]>;
export declare function updateCommentStatus(commentId: string, status: CommentStatus, actorField: "fixedBy" | "verifiedBy" | "resolvedBy" | "reopenedBy", actorId: string): Promise<(import("mongoose").Document<unknown, {}, import("./comment.model.js").CommentDocument, {}, {}> & import("./comment.model.js").CommentDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export declare function countBlockingUnresolvedComments(filter: {
    seriesId?: string;
    chapterId?: string;
    taskId?: string;
}): Promise<number>;
//# sourceMappingURL=comment.repository.d.ts.map