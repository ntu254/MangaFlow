import type { NextFunction, Request, Response } from "express"
import {
  editorApproveSubmissionService,
  mangakaApproveSubmissionService,
  rejectSubmissionService,
  requestSubmissionRevisionService,
} from "../submission.service.js"

export async function mangakaApproveSubmission(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const submission = await mangakaApproveSubmissionService({
    submissionId: req.params.submissionId as string,
    actor: req.user!,
    reviewerNote: req.body.reviewerNote,
  })

  res.json({ success: true, message: "Submission approved by Mangaka", data: submission })
}

export async function requestSubmissionRevision(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const submission = await requestSubmissionRevisionService({
    submissionId: req.params.submissionId as string,
    actor: req.user!,
    reviewerNote: req.body.reviewerNote,
  })

  res.json({ success: true, message: "Submission revision requested", data: submission })
}

export async function rejectSubmission(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const submission = await rejectSubmissionService({
    submissionId: req.params.submissionId as string,
    actor: req.user!,
    reviewerNote: req.body.reviewerNote,
  })

  res.json({ success: true, message: "Submission rejected", data: submission })
}

export async function editorApproveSubmission(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const submission = await editorApproveSubmissionService({
    submissionId: req.params.submissionId as string,
    actor: req.user!,
    reviewerNote: req.body.reviewerNote,
  })

  res.json({ success: true, message: "Submission final-approved by Editor", data: submission })
}
