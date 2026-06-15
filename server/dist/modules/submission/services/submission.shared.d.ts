export declare function getSubmissionWithTask(submissionId: string): Promise<{
    submission: import("mongoose").Document<unknown, {}, import("../submission.model.js").SubmissionDocument, {}, {}> & import("../submission.model.js").SubmissionDocument & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    };
    task: import("mongoose").Document<unknown, {}, import("../../task/task.model.js").TaskDocument, {}, {}> & import("../../task/task.model.js").TaskDocument & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    };
}>;
//# sourceMappingURL=submission.shared.d.ts.map