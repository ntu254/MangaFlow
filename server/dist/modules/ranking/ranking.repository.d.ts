export interface ImportRankingInput {
    period: string;
    seriesId: string;
    voteCount: number;
    readerScore: number;
    finalScore: number;
}
export declare function upsertRanking(input: ImportRankingInput): Promise<any>;
export declare function listRankings(): Promise<any[]>;
export declare function listRankingsBySeriesIds(seriesIds: unknown[]): Promise<any[]>;
export declare function getRankingById(rankingId: string): Promise<any | null>;
export declare function updateRankingStatus(rankingId: string, status: string): Promise<any | null>;
export declare function submitRanking(rankingId: string): Promise<any | null>;
export declare function voidRanking(rankingId: string): Promise<any | null>;
//# sourceMappingURL=ranking.repository.d.ts.map