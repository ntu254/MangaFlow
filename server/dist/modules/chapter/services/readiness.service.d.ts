export interface PublicationReadinessItemResult {
    key: "allPagesUploaded" | "allTasksApproved" | "allSubmissionsApproved" | "allCommentsResolved" | "editorFinalApprovalExists" | "publicationDateExists";
    passed: boolean;
    reason: string;
}
export declare function getChapterReadinessService(chapterId: string): Promise<{
    chapterId: string;
    chapterStatus: "DRAFT" | "IN_PRODUCTION" | "IN_REVIEW" | "READY_FOR_PUBLICATION" | "PUBLISHED" | "REVISION_REQUIRED";
    ready: boolean;
    items: PublicationReadinessItemResult[];
}>;
//# sourceMappingURL=readiness.service.d.ts.map