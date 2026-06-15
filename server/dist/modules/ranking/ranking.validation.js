import mongoose from "mongoose";
import { z } from "zod";
export const importRankingSchema = z.object({
    period: z.string().trim().min(1).max(40),
    seriesId: z.string().refine((value) => mongoose.isValidObjectId(value), { message: "Invalid series id" }),
    voteCount: z.number().int().nonnegative(),
    readerScore: z.number().min(1).max(10),
});
export const rankingIdParamsSchema = z.object({
    rankingId: z.string().refine((value) => mongoose.isValidObjectId(value), { message: "Invalid ranking id" }),
});
//# sourceMappingURL=ranking.validation.js.map