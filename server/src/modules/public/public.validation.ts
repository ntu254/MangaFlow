import { z } from "zod"

export const seriesSlugParamsSchema = z.object({
  seriesSlug: z.string().min(1, "Series slug is required"),
})

export const chapterSlugParamsSchema = z.object({
  chapterSlug: z.string().min(1, "Chapter slug is required"),
})

export const readerMetricsBodySchema = z.object({
  chapterId: z.string().min(1, "Chapter ID is required"),
  seriesId: z.string().min(1, "Series ID is required"),
  viewDurationSeconds: z.number().int().min(0).optional(),
})
