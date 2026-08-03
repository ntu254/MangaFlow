import { z } from "zod";

export const createMaterialSchema = z
  .object({
    seriesId: z.string().optional(),
    chapterId: z.string().optional(),
    pageId: z.string().optional(),
    proposalId: z.string().optional(),
    title: z.string().min(1).max(200).optional(),
    kind: z.string().optional(),
    type: z.string().optional(),
    category: z.string().optional(),
    description: z.string().max(2000).optional(),
    fileKey: z.string().optional(),
    url: z.string().optional(),
    thumbnailUrl: z.string().optional(),
    mimeType: z.string().optional(),
    size: z.number().optional(),
    tags: z.array(z.string()).optional(),
    metadata: z.any().optional(),
  })
  .strict();

export const patchMaterialSchema = z
  .object({
    chapterId: z.string().nullable().optional(),
    kind: z.string().optional(),
    title: z.string().min(1).max(200).optional(),
    type: z.string().optional(),
    category: z.string().optional(),
    description: z.string().max(2000).optional(),
    fileKey: z.string().optional(),
    url: z.string().optional(),
    thumbnailUrl: z.string().optional(),
    mimeType: z.string().optional(),
    size: z.number().optional(),
    tags: z.array(z.string()).optional(),
    metadata: z.any().optional(),
  })
  .strict();

export const addMaterialVersionSchema = z
  .object({
    fileKey: z.string().optional(),
    url: z.string().optional(),
    thumbnailUrl: z.string().optional(),
    mimeType: z.string().optional(),
    size: z.number().optional(),
    note: z.string().max(1000).optional(),
    metadata: z.any().optional(),
  })
  .strict();
