import mongoose from "mongoose"
import { z } from "zod"

const objectId = z.string().refine((value) => mongoose.isValidObjectId(value), {
  message: "Invalid id",
})

export const createSeriesSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  synopsis: z.string().trim().min(1, "Synopsis is required").max(2000),
  genres: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
})

export const seriesIdParamsSchema = z.object({
  seriesId: objectId,
})

export type CreateSeriesInput = z.infer<typeof createSeriesSchema>
