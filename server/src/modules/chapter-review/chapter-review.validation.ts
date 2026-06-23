import { z } from "zod"

export const chapterIdParamsSchema = z.object({
  chapterId: z.string().min(1, "Chapter ID is required"),
})

export const versionIdParamsSchema = z.object({
  versionId: z.string().min(1, "Chapter version ID is required"),
})

export const annotationIdParamsSchema = z.object({
  annotationId: z.string().min(1, "Annotation ID is required"),
})

export const reviewDecisionBodySchema = z.object({
  reviewerNote: z.string().trim().min(1, "Overall review is required").max(5000),
})

const geometrySchema = z.object({
  x: z.number().min(0).max(1).optional(),
  y: z.number().min(0).max(1).optional(),
  width: z.number().min(0).max(1).optional(),
  height: z.number().min(0).max(1).optional(),
})

export const createAnnotationBodySchema = z.object({
  pageId: z.string().min(1).optional(),
  body: z.string().trim().min(1, "Annotation body is required").max(5000),
  geometry: geometrySchema.optional(),
  isBlocking: z.boolean().optional(),
})

export const patchAnnotationBodySchema = z.object({
  body: z.string().trim().min(1).max(5000).optional(),
  geometry: geometrySchema.optional(),
  isBlocking: z.boolean().optional(),
  status: z.enum(["OPEN", "RESOLVED"]).optional(),
})
