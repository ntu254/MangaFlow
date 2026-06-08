import { z } from "zod"

export const taskIdParamsSchema = z.object({
  taskId: z.string().min(1, "Task ID is required"),
})

export const submissionIdParamsSchema = z.object({
  submissionId: z.string().min(1, "Submission ID is required"),
})

export const createSubmissionBodySchema = z
  .object({
    resultText: z.string().min(1).max(5000).optional(),
    fileAssetId: z.string().min(1).optional(),
  })
  .refine((body) => body.resultText || body.fileAssetId, {
    message: "Submission requires text result or file asset",
  })

export const reviewActionBodySchema = z.object({
  reviewerNote: z.string().max(2000).optional(),
})
