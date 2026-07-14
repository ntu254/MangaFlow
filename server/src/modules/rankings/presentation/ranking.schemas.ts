import { z } from "zod";

export const rankingImportRowSchema = z
  .object({
    seriesId: z.string().min(1).optional(),
    seriesTitle: z.string().min(1).optional(),
    score: z.coerce.number().min(0).max(10).optional(),
    finalScore: z.coerce.number().min(0).max(10).optional(),
    readerScore: z.coerce.number().min(0).max(10).optional(),
    votes: z.coerce.number().int().min(0).optional(),
    voteCount: z.coerce.number().int().min(0).optional(),
    status: z.string().optional(),
    atRisk: z.boolean().optional(),
  })
  .strict();

export const rankingImportSchema = z
  .object({
    period: z.string().min(1).max(80),
    source: z.string().min(1).max(80),
    fileName: z.string().min(1).max(240).optional(),
    rows: z.array(rankingImportRowSchema).min(1).max(500),
  })
  .strict();
