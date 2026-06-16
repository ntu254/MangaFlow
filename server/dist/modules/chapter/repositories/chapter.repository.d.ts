import type { ChapterStatus } from "../../../shared/workflow/status.js";
export interface CreateChapterInput {
    seriesId: string;
    chapterNumber: number;
    title: string;
}
export interface CreateChapterResult {
    id: string;
    seriesId: string;
    chapterNumber: number;
    title: string;
    status: ChapterStatus;
    publicationTypeSnapshot?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare function createChapterRepository(input: CreateChapterInput): Promise<CreateChapterResult>;
export declare function getChapterById(chapterId: string): Promise<any | null>;
export declare function listChaptersBySeries(seriesId: string): Promise<any[]>;
export declare function updateChapterStatus(chapterId: string, status: ChapterStatus): Promise<any | null>;
//# sourceMappingURL=chapter.repository.d.ts.map