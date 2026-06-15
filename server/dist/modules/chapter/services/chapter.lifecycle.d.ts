import { type AccessActor } from "../../../shared/policies/accessPolicy.service.js";
export interface CreateChapterServiceInput {
    seriesId: string;
    chapterNumber: number;
    title: string;
}
export declare function createChapterService(input: CreateChapterServiceInput): Promise<import("../chapter.repository.js").CreateChapterResult>;
export declare function listChaptersService(seriesId: string): Promise<any[]>;
export declare function getChapterService(chapterId: string, actor: AccessActor): Promise<any>;
export declare function updateChapterStatusService(chapterId: string, status: string, actor: AccessActor): Promise<any>;
//# sourceMappingURL=chapter.lifecycle.d.ts.map