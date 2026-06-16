import type { SubmissionStatus } from "../../shared/workflow/status.js";
export interface CreateSubmissionInput {
    taskId: string;
    submittedBy: string;
    resultText?: string;
    fileAssetId?: string;
}
export declare function getTaskForSubmission(taskId: string): Promise<(import("mongoose").Document<unknown, {}, import("../task/task.model.js").TaskDocument, {}, {}> & import("../task/task.model.js").TaskDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export declare function getSubmissionById(submissionId: string): Promise<(import("mongoose").Document<unknown, {}, import("./submission.model.js").SubmissionDocument, {}, {}> & import("./submission.model.js").SubmissionDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export declare function getLatestSubmissionForTask(taskId: string): Promise<(import("mongoose").Document<unknown, {}, import("./submission.model.js").SubmissionDocument, {}, {}> & import("./submission.model.js").SubmissionDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export declare function createSubmissionRecord(input: CreateSubmissionInput): Promise<(import("mongoose").Document<unknown, {}, import("./submission.model.js").SubmissionDocument, {}, {}> & import("./submission.model.js").SubmissionDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export declare function updateSubmissionStatus(submissionId: string, status: SubmissionStatus, reviewerNote?: string): Promise<(import("mongoose").Document<unknown, {}, import("./submission.model.js").SubmissionDocument, {}, {}> & import("./submission.model.js").SubmissionDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export declare function updateTaskStatusForSubmission(taskId: string, status: string): Promise<(import("mongoose").Document<unknown, {}, import("../task/task.model.js").TaskDocument, {}, {}> & import("../task/task.model.js").TaskDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export declare function updateTaskReviewState(taskId: string, patch: Record<string, unknown>): Promise<(import("mongoose").Document<unknown, {}, import("../task/task.model.js").TaskDocument, {}, {}> & import("../task/task.model.js").TaskDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
export declare function listSubmissionsByTask(taskId: string): Promise<(import("mongoose").FlattenMaps<import("./submission.model.js").SubmissionDocument> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
})[]>;
export declare function listReviewQueueSubmissions(seriesIds: string[], status: SubmissionStatus): Promise<(import("mongoose").FlattenMaps<import("./submission.model.js").SubmissionDocument> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
})[]>;
//# sourceMappingURL=submission.repository.d.ts.map