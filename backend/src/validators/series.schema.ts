import { z } from "zod";

export const patchSeriesSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    slug: z.string().max(100).optional(),
    synopsis: z.string().max(5000).optional(),
    genres: z.array(z.string()).optional(),
    coverUrl: z.string().optional(),
    coverFileKey: z.string().optional(),
    cadence: z.string().optional(),
    startDate: z.string().optional(),
    targetChapters: z.number().int().min(1).max(500).optional(),
  })
  .strict();
