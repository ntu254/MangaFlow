import { z } from "zod";
import { PAGE_STATUSES } from "../types.js";

const pageStatusSchema = z.enum(PAGE_STATUSES);
const isoDateTimeSchema = z.string().datetime({ offset: true });
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function isNotPastDate(dateStr?: string): boolean {
  if (!dateStr) return true;
  const target = new Date(dateStr).getTime();
  const todayMidnight = new Date();
  todayMidnight.setUTCHours(0, 0, 0, 0);
  return target >= todayMidnight.getTime();
}

function hasReviewBuffer(draftDueAt?: string, reviewDueAt?: string): boolean {
  if (!draftDueAt || !reviewDueAt) return true;
  const draftTime = new Date(draftDueAt).getTime();
  const reviewTime = new Date(reviewDueAt).getTime();
  return reviewTime - draftTime >= ONE_DAY_MS;
}

function addDeadlineIssues(
  data: { draftDueAt?: string; reviewDueAt?: string },
  ctx: z.RefinementCtx,
) {
  if (!isNotPastDate(data.draftDueAt)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Draft delivery date cannot be set in the past.",
      path: ["draftDueAt"],
    });
  }
  if (!isNotPastDate(data.reviewDueAt)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Tantou review date cannot be set in the past.",
      path: ["reviewDueAt"],
    });
  }
  if (!hasReviewBuffer(data.draftDueAt, data.reviewDueAt)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Tantou review date must be at least one day after the draft delivery date.",
      path: ["reviewDueAt"],
    });
  }
}

const deadlineFields = {
  draftDueAt: isoDateTimeSchema.optional(),
  reviewDueAt: isoDateTimeSchema.optional(),
};

/** Validates a complete deadline plan, including an existing chapter merged with a PATCH body. */
export const chapterDeadlinePlanSchema = z.object(deadlineFields).superRefine(addDeadlineIssues);

export const createChapterSchema = z
  .object({
    number: z.number().int().min(1).max(9999).optional(),
    title: z.string().min(1).max(200).optional(),
    targetPages: z.number().int().min(1).max(200).optional(),
    assigneeId: z.string().optional(),
    assigneeName: z.string().optional(),
    ...deadlineFields,
    plannedAt: z.string().optional(),
  })
  .strict()
  .superRefine(addDeadlineIssues);

export const patchChapterSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    number: z.number().int().min(1).max(9999).optional(),
    targetPages: z.number().int().min(1).max(200).optional(),
    ...deadlineFields,
    scheduledAt: z.string().optional(),
    reviewNotes: z.array(z.any()).optional(),
  })
  .strict()
  .superRefine(addDeadlineIssues);

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
