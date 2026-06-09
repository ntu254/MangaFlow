import type { NextFunction, Request, Response } from "express"
import {
  createTaskSubmissionService,
  listReviewQueueSubmissionsService,
  listTaskSubmissionsService,
} from "../submission.service.js"

export async function createTaskSubmission(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const submission = await createTaskSubmissionService({
    taskId: req.params.taskId as string,
    actor: req.user!,
    resultText: req.body.resultText,
    fileAssetId: req.body.fileAssetId,
  })

  res.status(201).json({ success: true, message: "Submission created successfully", data: submission })
}

export async function listTaskSubmissions(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const submissions = await listTaskSubmissionsService(req.params.taskId as string, req.user!)
  res.json({ success: true, message: "Submissions retrieved successfully", data: submissions })
}

export async function listReviewQueueSubmissions(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const submissions = await listReviewQueueSubmissionsService(req.user!)
  res.json({ success: true, message: "Review queue retrieved successfully", data: submissions })
}
