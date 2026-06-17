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
export declare function markChapterReadyService(chapterId: string): Promise<import("mongoose").Document<unknown, {}, import("../chapter.model.js").ChapterDocument, {}, {}> & import("../chapter.model.js").ChapterDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
//# sourceMappingURL=readiness.service.d.ts.map