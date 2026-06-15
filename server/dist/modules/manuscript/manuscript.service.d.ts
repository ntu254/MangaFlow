import type { UserRole } from "../auth/auth.types.js";
interface ManuscriptReviewActor {
    userId: string;
    role: UserRole;
}
interface ReviewInput {
    manuscriptId: string;
    actor: ManuscriptReviewActor;
    reviewNote?: string;
}
export declare function requestManuscriptRevisionService(input: ReviewInput): Promise<(import("mongoose").Document<unknown, {}, import("../series/series.model.js").ManuscriptDocument, {}, {}> & import("../series/series.model.js").ManuscriptDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export declare function forwardManuscriptToBoardService(input: ReviewInput): Promise<(import("mongoose").Document<unknown, {}, import("../series/series.model.js").ManuscriptDocument, {}, {}> & import("../series/series.model.js").ManuscriptDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export declare function rejectManuscriptService(input: ReviewInput): Promise<(import("mongoose").Document<unknown, {}, import("../series/series.model.js").ManuscriptDocument, {}, {}> & import("../series/series.model.js").ManuscriptDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export {};
//# sourceMappingURL=manuscript.service.d.ts.map