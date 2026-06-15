import type { SubmissionActor } from "../policies/submission-access.policy.js";
export interface SubmitTaskInput {
    taskId: string;
    actor: SubmissionActor;
    resultText?: string;
    fileAssetId?: string;
}
export declare function createTaskSubmissionService(input: SubmitTaskInput): Promise<import("mongoose").Document<unknown, {}, import("../submission.model.js").SubmissionDocument, {}, {}> & import("../submission.model.js").SubmissionDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
export declare function listTaskSubmissionsService(taskId: string, actor: SubmissionActor): Promise<(import("mongoose").FlattenMaps<import("../submission.model.js").SubmissionDocument> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
})[]>;
export declare function listReviewQueueSubmissionsService(actor: SubmissionActor): Promise<(import("mongoose").FlattenMaps<import("../submission.model.js").SubmissionDocument> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
})[]>;
//# sourceMappingURL=submission-query.service.d.ts.map