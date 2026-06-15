import type { CreateCommentServiceInput } from "../comment.service.js";
export interface NormalizedCommentScope {
    seriesId: string;
    chapterId?: string;
    pageId?: string;
    regionId?: string;
    taskId?: string;
    submissionId?: string;
}
export declare function normalizeCommentScope(input: CreateCommentServiceInput): Promise<NormalizedCommentScope>;
//# sourceMappingURL=comment-scope.service.d.ts.map