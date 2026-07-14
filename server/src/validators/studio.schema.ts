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
    status: z.string().optional(),
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
    status: z.string().optional(),
    label: z.string().max(200).optional(),
    metadata: z.any().optional(),
  })
  .strict();

export const createStudioTaskSchema = z
  .object({
    seriesId: z.string().optional(),
    chapterId: z.string().optional(),
    pageId: z.string().optional(),
    regionId: z.string().optional(),
    assigneeId: z.string().optional(),
    assigneeName: z.string().optional(),
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    instructions: z.string().max(5000).optional(),
    type: z.string().optional(),
    priority: z.string().optional(),
    dueAt: z.string().optional(),
    status: z.string().optional(),
    referenceFiles: z.array(z.record(z.string(), z.unknown())).optional(),
    metadata: z.any().optional(),
  })
  .strict();

export const patchStudioTaskSchema = z
  .object({
    seriesId: z.string().optional(),
    chapterId: z.string().optional(),
    pageId: z.string().optional(),
    regionId: z.string().optional(),
    assigneeId: z.string().optional(),
    assigneeName: z.string().optional(),
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    instructions: z.string().max(5000).optional(),
    type: z.string().optional(),
    priority: z.string().optional(),
    dueAt: z.string().optional(),
    status: z.string().optional(),
    referenceFiles: z.array(z.record(z.string(), z.unknown())).optional(),
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
    // Primary content field
    body: z.string().min(1).max(5000).optional(),
    /** @deprecated use body */
    text: z.string().min(1).max(5000).optional(),
    // Primary blocking flag
    isBlocking: z.boolean().optional(),
    /** @deprecated use isBlocking */
    blocking: z.boolean().optional(),
    status: z.enum(["OPEN", "FIXED", "RESOLVED"]).optional(),
  })
  .strict();

export const patchCommentSchema = z
  .object({
    body: z.string().min(1).max(5000).optional(),
    /** @deprecated use body */
    text: z.string().min(1).max(5000).optional(),
    isBlocking: z.boolean().optional(),
    /** @deprecated use isBlocking */
    blocking: z.boolean().optional(),
    status: z.enum(["OPEN", "FIXED", "RESOLVED"]).optional(),
  })
  .strict();
