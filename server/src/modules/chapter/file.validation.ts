import { z } from "zod"

export const getPresignedUploadUrlSchema = z.object({
  body: z.object({
    originalName: z.string().min(1, "Original name is required"),
    contentType: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
    expiresIn: z.number().int().positive().optional(),
    chapterId: z.string().min(1, "Chapter ID is required").optional(),
    pageId: z.string().min(1, "Page ID is required").optional(),
  }),
})

export const pageIdParamsSchema = z.object({
  params: z.object({
    pageId: z.string().min(1, "Page ID is required"),
  }),
})

const uploadAssetSchema = z.object({
  fileAssetId: z.string().min(1, "File asset ID is required"),
  r2Key: z.string().min(1, "R2 key is required"),
  originalName: z.string().min(1, "Original name is required"),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
  size: z.number().int().positive("File size must be positive"),
})

/**
 * Flow-02: confirm-upload expects all three derived assets so the system can
 * link originalFileAssetId / workingFileAssetId / thumbnailFileAssetId.
 */
export const confirmPageUploadSchema = z.object({
  params: z.object({
    pageId: z.string().min(1, "Page ID is required"),
  }),
  body: z.object({
    original: uploadAssetSchema,
    working: uploadAssetSchema,
    thumbnail: uploadAssetSchema,
  }),
})

export const fileAssetIdParamsSchema = z.object({
  params: z.object({
    fileAssetId: z.string().min(1, "File asset ID is required"),
  }),
})

/**
 * Flow-04: Region creation — regionIndex is auto-assigned by the service.
 * Only bbox and type are provided by the client.
 */
export const createRegionSchema = z.object({
  params: z.object({
    pageId: z.string().min(1, "Page ID is required"),
  }),
  body: z.object({
    type: z.enum(["PANEL", "BUBBLE", "SFX", "AREA", "OTHER"]).optional(),
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

/**
 * Flow-04: Update region type and/or bbox coordinates.
 * Replaces the old updateRegionStatus (ACTIVE/ARCHIVED) with geometry/type edits.
 */
export const updateRegionSchema = z.object({
  params: z.object({
    regionId: z.string().min(1, "Region ID is required"),
  }),
  body: z
    .object({
      type: z.enum(["PANEL", "BUBBLE", "SFX", "AREA", "OTHER"]).optional(),
      bbox: z
        .object({
          x: z.number(),
          y: z.number(),
          width: z.number().positive("Width must be positive"),
          height: z.number().positive("Height must be positive"),
        })
        .optional(),
    })
    .refine((data) => data.type !== undefined || data.bbox !== undefined, {
      message: "At least one of type or bbox must be provided",
    }),
})

export const listRegionsParamsSchema = z.object({
  params: z.object({
    pageId: z.string().min(1, "Page ID is required"),
  }),
})

export const aiResultIdParamsSchema = z.object({
  params: z.object({
    aiResultId: z.string().min(1, "AI result ID is required"),
  }),
})

export const aiSuggestionDecisionSchema = z.object({
  params: z.object({
    aiResultId: z.string().min(1, "AI result ID is required"),
  }),
  body: z.object({
    suggestionIndex: z.number().int().nonnegative("Suggestion index must be non-negative"),
  }),
})
