import { z } from "zod";

export const createSeriesSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    slug: z.string().max(100).optional(),
    synopsis: z.string().max(5000).optional(),
    genres: z.array(z.string()).optional(),
    coverUrl: z.string().optional(),
    coverFileKey: z.string().optional(),
    status: z.string().optional(),
    cadence: z.string().optional(),
    startDate: z.string().optional(),
    targetChapters: z.number().int().min(1).max(500).optional(),
    authorId: z.string().optional(),
    authorName: z.string().optional(),
    editorId: z.string().optional(),
    editorName: z.string().optional(),
    assistantIds: z.array(z.string()).optional(),
    proposalId: z.string().optional(),
  })
  .strict();

export const patchSeriesSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    slug: z.string().max(100).optional(),
    synopsis: z.string().max(5000).optional(),
    genres: z.array(z.string()).optional(),
    coverUrl: z.string().optional(),
    coverFileKey: z.string().optional(),
    startDate: z.string().optional(),
    targetChapters: z.number().int().min(1).max(500).optional(),
  })
  .strict();
