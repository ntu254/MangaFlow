export declare function assertSubmissionPayload(input: {
    resultText?: string;
    fileAssetId?: string;
}): void;
export declare function assertTaskSubmittable(status: string): void;
export declare function assertMangakaApprovalState(submissionStatus: string, taskStatus: string): void;
export declare function assertEditorApprovalState(submissionStatus: string, taskStatus: string): void;
/**
 * Flow-06: Mangaka can reject SUBMITTED work.
 * Flow-07: Editor can reject MANGAKA_APPROVED work.
 */
export declare function assertMangakaRejectState(submissionStatus: string, taskStatus: string): void;
export declare function assertEditorRejectState(submissionStatus: string, taskStatus: string): void;
/** Flow-06/07: revision feedback is mandatory. */
export declare function assertRevisionFeedback(reviewerNote: string | undefined): void;
//# sourceMappingURL=submission-transition.guard.d.ts.map