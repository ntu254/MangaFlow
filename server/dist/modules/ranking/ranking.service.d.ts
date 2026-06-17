export interface ImportRankingServiceInput {
    period: string;
    seriesId: string;
    voteCount: number;
    readerScore: number;
}
export declare function calculateFinalScore(voteCount: number, readerScore: number): number;
export declare function importRankingService(input: ImportRankingServiceInput): Promise<any>;
export declare function listRankingsService(): Promise<any[]>;
export declare function submitRankingService(rankingId: string): Promise<any>;
export declare function finalizeRankingService(rankingId: string): Promise<any>;
export declare function voidRankingService(rankingId: string): Promise<any>;
export declare function listMangakaRankingsService(mangakaId: string): Promise<any[]>;
//# sourceMappingURL=ranking.service.d.ts.map