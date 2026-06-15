export interface ValidatedTaskScope {
    taskType: {
        baseRate: number;
    };
}
export declare function validateTaskCreationScope(input: {
    seriesId: string;
    chapterId: string;
    pageId?: string;
    regionId?: string;
    taskTypeId: string;
    contextPageIds?: string[];
}): Promise<ValidatedTaskScope>;
//# sourceMappingURL=task-scope.guard.d.ts.map