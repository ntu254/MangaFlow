import { z } from "zod";

export const createRegionSchema = z
  .object({
    pageId: z.string().optional(),
    chapterId: z.string().optional(),
    seriesId: z.string().optional(),
    type: z.string().optional(),
    x: z.number().optional(),
    y: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    label: z.string().max(200).optional(),
    metadata: z.any().optional(),
  })
  .strict();

export const patchRegionSchema = z
  .object({
    pageId: z.string().optional(),
    chapterId: z.string().optional(),
    seriesId: z.string().optional(),
    type: z.string().optional(),
    x: z.number().optional(),
    y: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    label: z.string().max(200).optional(),
    metadata: z.any().optional(),
  })
  .strict();

export const createStudioTaskSchema = z
  .object({
    seriesId: z.string().optional(),
    chapterId: z.string().optional(),
    pageId: z.string().min(1, "pageId is required."),
    assigneeId: z.string().min(1).optional(),
    assigneeName: z.string().optional(),
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    instructions: z.string().max(5000).optional(),
    type: z.string().optional(),
    priority: z.string().optional(),
    dueAt: z.string().optional(),
    isRequired: z.boolean().optional(),
    workUnitType: z.string().optional(),
    rateCode: z.string().min(2).max(64).optional(),
    quantity: z.number().positive().optional(),
    currency: z.string().optional(),
    metadata: z.any().optional(),
  })
  .strict();

export const assignPageSchema = z
  .object({ assistantId: z.string().min(1, "assistantId is required.") })
  .strict();

export const pageAssignmentActionSchema = z
  .object({ reason: z.string().max(2000).optional(), rejectReason: z.string().max(2000).optional() })
  .strict();

export const patchStudioTaskSchema = z
  .object({
    seriesId: z.string().optional(),
    chapterId: z.string().optional(),
    pageId: z.string().optional(),
    assigneeId: z.string().optional(),
    assigneeName: z.string().optional(),
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    instructions: z.string().max(5000).optional(),
    type: z.string().optional(),
    priority: z.string().optional(),
    dueAt: z.string().optional(),
    isRequired: z.boolean().optional(),
    workUnitType: z.string().optional(),
    rateCode: z.string().min(2).max(64).optional(),
    quantity: z.number().positive().optional(),
    currency: z.string().optional(),
    metadata: z.any().optional(),
  })
  .strict();

export const createCommentSchema = z
  .object({
    seriesId: z.string().optional(),
    chapterId: z.string().optional(),
    pageId: z.string().optional(),
    regionId: z.string().optional(),
    taskId: z.string().optional(),
    // Structured target (new preferred)
    targetType: z.enum(["CHAPTER", "PAGE", "REGION", "TASK", "SUBMISSION"]).optional(),
    targetId: z.string().optional(),
    targetVersionId: z.string().optional(),
    // Primary content field
    body: z.string().min(1).max(5000).optional(),
    /** @deprecated use body */
    text: z.string().min(1).max(5000).optional(),
    // Relative canvas coordinates. They are feedback anchors, never editable artwork.
    x: z.number().min(0).max(1).optional(),
    y: z.number().min(0).max(1).optional(),
    // Primary blocking flag
    isBlocking: z.boolean().optional(),
  })
  .strict();

export const patchCommentSchema = z
  .object({
    body: z.string().min(1).max(5000).optional(),
    /** @deprecated use body */
    text: z.string().min(1).max(5000).optional(),
    x: z.number().min(0).max(1).optional(),
    y: z.number().min(0).max(1).optional(),
    isBlocking: z.boolean().optional(),
  })
  .strict();

export const replyCommentSchema = z
  .object({
    body: z.string().min(1).max(5000).optional(),
    /** @deprecated use body */
    text: z.string().min(1).max(5000).optional(),
  })
  .strict()
  .refine((value) => Boolean(value.body?.trim() || value.text?.trim()), {
    message: "Reply body is required.",
  });
