import type { SubmissionActor } from "../policies/submission-access.policy.js";
export interface ReviewInput {
    submissionId: string;
    actor: SubmissionActor;
    reviewerNote?: string;
}
export declare function mangakaApproveSubmissionService(input: ReviewInput): Promise<(import("mongoose").Document<unknown, {}, import("../submission.model.js").SubmissionDocument, {}, {}> & import("../submission.model.js").SubmissionDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export declare function editorApproveSubmissionService(input: ReviewInput): Promise<(import("mongoose").Document<unknown, {}, import("../submission.model.js").SubmissionDocument, {}, {}> & import("../submission.model.js").SubmissionDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export declare function requestSubmissionRevisionService(input: ReviewInput): Promise<(import("mongoose").Document<unknown, {}, import("../submission.model.js").SubmissionDocument, {}, {}> & import("../submission.model.js").SubmissionDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export declare function rejectSubmissionService(input: ReviewInput): Promise<(import("mongoose").Document<unknown, {}, import("../submission.model.js").SubmissionDocument, {}, {}> & import("../submission.model.js").SubmissionDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export declare function editorRejectSubmissionService(input: ReviewInput): Promise<(import("mongoose").Document<unknown, {}, import("../submission.model.js").SubmissionDocument, {}, {}> & import("../submission.model.js").SubmissionDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
//# sourceMappingURL=submission-command.service.d.ts.map