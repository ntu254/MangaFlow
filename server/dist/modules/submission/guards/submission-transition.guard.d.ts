export declare function assertSubmissionPayload(input: {
    resultText?: string;
    fileAssetId?: string;
}): void;
export declare function assertTaskSubmittable(status: string): void;
export declare function assertMangakaApprovalState(submissionStatus: string, taskStatus: string): void;
export declare function assertEditorApprovalState(submissionStatus: string, taskStatus: string): void;
export declare function assertRejectState(submissionStatus: string, taskStatus: string): void;
//# sourceMappingURL=submission-transition.guard.d.ts.map