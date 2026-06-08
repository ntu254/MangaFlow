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

export const createManuscriptUploadSchema = z.object({
  originalName: z.string().trim().min(1, "Original name is required").max(255),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf", "application/zip"]),
  size: z.number().int().positive("File size must be positive").max(100 * 1024 * 1024, "File size exceeds 100MB limit"),
  expiresIn: z.number().int().positive().max(3600).optional(),
})
