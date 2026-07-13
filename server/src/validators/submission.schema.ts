import { z } from "zod";

export const createSubmissionSchema = z.object({
  taskId: z.string().optional(),
  seriesId: z.string().optional(),
  chapterId: z.string().optional(),
  pageId: z.string().optional(),
  regionId: z.string().optional(),
  intent: z.enum(["DRAFT", "SUBMIT"]).optional(),
  fileKey: z.string().optional(),
  fileName: z.string().optional(),
  fileUrl: z.string().optional(),
  fileSizeKB: z.number().optional(),
  mimeType: z.string().optional(),
  imageUrl: z.string().optional(),
  notes: z.string().max(2000).optional(),
  version: z.number().int().positive().optional(),
  reviewStage: z.enum(["MANGAKA_REVIEW", "EDITOR_REVIEW", "FINAL"]).optional(),
  status: z.enum(["DRAFT", "PENDING", "MANGAKA_APPROVED", "MANGAKA_REVISION_REQUESTED",
    "EDITOR_APPROVED", "EDITOR_REVISION_REQUESTED", "REJECTED", "SUPERSEDED"]).optional(),
  metadata: z.any().optional()
}).strict();

export const submissionActionSchema = z.object({
  reason: z.string().max(2000).optional(),
  comment: z.string().max(2000).optional(),
  requestedChanges: z.string().max(2000).optional(),
  reviewerNote: z.string().max(2000).optional(),
  mangakaNote: z.string().max(2000).optional(),
  editorNote: z.string().max(2000).optional(),
  reviewStage: z.enum(["MANGAKA_REVIEW", "EDITOR_REVIEW", "FINAL"]).optional(),
  metadata: z.any().optional()
}).strict();
