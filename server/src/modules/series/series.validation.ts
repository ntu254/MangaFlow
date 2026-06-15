import mongoose from "mongoose"
import { z } from "zod"

const objectId = z.string().refine((value) => mongoose.isValidObjectId(value), {
  message: "Invalid id",
})

export const createSeriesSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  synopsis: z.string().trim().min(1, "Synopsis is required").max(2000),
  logline: z.string().trim().max(200).optional(),
  premise: z.string().trim().max(2000).optional(),
  characters: z.string().trim().max(2000).optional(),
  conflict: z.string().trim().max(2000).optional(),
  targetAudience: z.string().trim().max(120).optional(),
  publicationType: z.string().trim().max(120).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  genres: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
})

// Partial update used by "Save as Draft". Every field is optional so the
// client can persist progress without completing the whole form. Title and
// synopsis, when provided, still must be non-empty.
export const updateSeriesSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(120).optional(),
    synopsis: z.string().trim().min(1, "Synopsis is required").max(2000).optional(),
    logline: z.string().trim().max(200).optional(),
    premise: z.string().trim().max(2000).optional(),
    characters: z.string().trim().max(2000).optional(),
    conflict: z.string().trim().max(2000).optional(),
    targetAudience: z.string().trim().max(120).optional(),
    publicationType: z.string().trim().max(120).optional(),
    tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
    genres: z.array(z.string().trim().min(1).max(40)).max(10).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required to update",
  })

export const seriesIdParamsSchema = z.object({
  seriesId: objectId,
})

export type CreateSeriesInput = z.infer<typeof createSeriesSchema>
export type UpdateSeriesInput = z.infer<typeof updateSeriesSchema>

export const createManuscriptUploadSchema = z.object({
  originalName: z.string().trim().min(1, "Original name is required").max(255),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf", "application/zip"]),
  size: z.number().int().positive("File size must be positive").max(100 * 1024 * 1024, "File size exceeds 100MB limit"),
  expiresIn: z.number().int().positive().max(3600).optional(),
})
