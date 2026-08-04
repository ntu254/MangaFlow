import { z } from "zod";
import { PAGE_STATUSES } from "../types.js";

const pageStatusSchema = z.enum(PAGE_STATUSES);

export const createChapterSchema = z
  .object({
    number: z.number().int().min(1).max(9999).optional(),
    title: z.string().min(1).max(200).optional(),
    targetPages: z.number().int().min(1).max(200).optional(),
    assigneeId: z.string().optional(),
    assigneeName: z.string().optional(),
    draftDueAt: z.string().optional(),
    reviewDueAt: z.string().optional(),
    plannedAt: z.string().optional(),
  })
  .strict();

export const patchChapterSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    number: z.number().int().min(1).max(9999).optional(),
    targetPages: z.number().int().min(1).max(200).optional(),
    draftDueAt: z.string().optional(),
    reviewDueAt: z.string().optional(),
    scheduledAt: z.string().optional(),
    reviewNotes: z.array(z.any()).optional(),
  })
  .strict();

export const createPageSchema = z
  .object({
    id: z.string().optional(),
    pageNumber: z.number().int().min(1).max(9999).optional(),
    status: pageStatusSchema.optional(),
    imageUrl: z.string().min(1).optional(),
    fileKey: z.string().optional(),
    fileName: z.string().optional(),
    fileUrl: z.string().optional(),
    sizeKB: z.number().optional(),
    mimeType: z.string().optional(),
    imageWidth: z.number().optional(),
    imageHeight: z.number().optional(),
  })
  .strict();

export const patchPageSchema = z
  .object({
    pageNumber: z.number().int().min(1).max(9999).optional(),
    status: pageStatusSchema.optional(),
    imageUrl: z.string().min(1).optional(),
    fileKey: z.string().optional(),
    fileName: z.string().optional(),
    fileUrl: z.string().optional(),
    sizeKB: z.number().optional(),
    mimeType: z.string().optional(),
    imageWidth: z.number().optional(),
    imageHeight: z.number().optional(),
  })
  .strict();

export const reorderPagesSchema = z
  .object({
    orderedPageIds: z.array(z.string().min(1)).min(1).max(9999),
  })
  .strict();
