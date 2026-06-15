import { z } from "zod";
export declare const importRankingSchema: z.ZodObject<{
    period: z.ZodString;
    seriesId: z.ZodEffects<z.ZodString, string, string>;
    voteCount: z.ZodNumber;
    readerScore: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    seriesId: string;
    period: string;
    voteCount: number;
    readerScore: number;
}, {
    seriesId: string;
    period: string;
    voteCount: number;
    readerScore: number;
}>;
export declare const rankingIdParamsSchema: z.ZodObject<{
    rankingId: z.ZodEffects<z.ZodString, string, string>;
}, "strip", z.ZodTypeAny, {
    rankingId: string;
}, {
    rankingId: string;
}>;
//# sourceMappingURL=ranking.validation.d.ts.map