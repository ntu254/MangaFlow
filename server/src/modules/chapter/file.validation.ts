import { z } from "zod"

export const getPresignedUploadUrlSchema = z.object({
  body: z.object({
    originalName: z.string().min(1, "Original name is required"),
    contentType: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
    expiresIn: z.number().int().positive().optional(),
  }),
})

export const pageIdParamsSchema = z.object({
  params: z.object({
    pageId: z.string().min(1, "Page ID is required"),
  }),
})

export const confirmPageUploadSchema = z.object({
  params: z.object({
    pageId: z.string().min(1, "Page ID is required"),
  }),
  body: z.object({
    fileAssetId: z.string().min(1, "File asset ID is required"),
    r2Key: z.string().min(1, "R2 key is required"),
    originalName: z.string().min(1, "Original name is required"),
    mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
    size: z.number().int().positive("File size must be positive"),
  }),
})

export const fileAssetIdParamsSchema = z.object({
  params: z.object({
    fileAssetId: z.string().min(1, "File asset ID is required"),
  }),
})

export const createRegionSchema = z.object({
  params: z.object({
    pageId: z.string().min(1, "Page ID is required"),
  }),
  body: z.object({
    regionIndex: z.number().int().nonnegative("Region index must be non-negative"),
    bbox: z.object({
      x: z.number(),
      y: z.number(),
      width: z.number().positive("Width must be positive"),
      height: z.number().positive("Height must be positive"),
    }),
  }),
})

export const regionIdParamsSchema = z.object({
  params: z.object({
    regionId: z.string().min(1, "Region ID is required"),
  }),
})

export const updateRegionStatusSchema = z.object({
  params: z.object({
    regionId: z.string().min(1, "Region ID is required"),
  }),
  body: z.object({
    status: z.enum(["ACTIVE", "ARCHIVED"]),
  }),
})

export const listRegionsParamsSchema = z.object({
  params: z.object({
    pageId: z.string().min(1, "Page ID is required"),
  }),
})