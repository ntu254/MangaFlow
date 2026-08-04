import { z } from "zod";

export const createSubmissionSchema = z.object({
  taskId: z.string().optional(),
  seriesId: z.string().optional(),
  chapterId: z.string().optional(),
  pageId: z.string().optional(),
  intent: z.enum(["DRAFT", "SUBMIT"]).optional(),
  fileKey: z.string().optional(),
  fileName: z.string().optional(),
  fileUrl: z.string().optional(),
  fileSizeKB: z.number().optional(),
  mimeType: z.string().optional(),
  imageUrl: z.string().optional(),
  notes: z.string().max(2000).optional(),
  version: z.number().int().positive().optional(),
  status: z.enum(["PENDING", "MANGAKA_APPROVED", "REVISION_REQUESTED", "REJECTED", "SUPERSEDED"]).optional(),
  metadata: z.any().optional()
}).strict();

export const submissionActionSchema = z.object({
  reason: z.string().max(2000).optional(),
  comment: z.string().max(2000).optional(),
  requestedChanges: z.string().max(2000).optional(),
  reviewerNote: z.string().max(2000).optional(),
  mangakaNote: z.string().max(2000).optional(),
  editorNote: z.string().max(2000).optional(),
  metadata: z.any().optional()
}).strict();
