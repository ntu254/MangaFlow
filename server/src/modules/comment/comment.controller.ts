import type { Request, Response } from "express"
import {
  createCommentService,
  listCommentsByTaskService,
  markCommentFixedService,
  reopenCommentService,
  resolveCommentService,
  verifyCommentFixedService,
} from "./comment.service.js"

export async function createComment(req: Request, res: Response): Promise<void> {
  const comment = await createCommentService({
    actor: req.user!,
    seriesId: req.body.seriesId,
    chapterId: req.body.chapterId,
    pageId: req.body.pageId,
    regionId: req.body.regionId,
    taskId: req.body.taskId,
    submissionId: req.body.submissionId,
    body: req.body.body,
    isBlocking: req.body.isBlocking,
  })
  res.status(201).json({ success: true, message: "Comment created", data: comment })
}

export async function markCommentFixed(req: Request, res: Response): Promise<void> {
  const comment = await markCommentFixedService(String(req.params.id), req.user!)
  res.json({ success: true, message: "Comment marked fixed", data: comment })
}

export async function verifyCommentFixed(req: Request, res: Response): Promise<void> {
  const comment = await verifyCommentFixedService(String(req.params.id), req.user!)
  res.json({ success: true, message: "Comment fix verified", data: comment })
}

export async function resolveComment(req: Request, res: Response): Promise<void> {
  const comment = await resolveCommentService(String(req.params.id), req.user!)
  res.json({ success: true, message: "Comment resolved", data: comment })
}

export async function reopenComment(req: Request, res: Response): Promise<void> {
  const comment = await reopenCommentService(String(req.params.id), req.user!)
  res.json({ success: true, message: "Comment reopened", data: comment })
}

export async function listTaskComments(
  req: Request,
  res: Response,
): Promise<void> {
  const comments = await listCommentsByTaskService(
    req.params.taskId as string,
    req.user!,
  )

  res.json({
    success: true,
    message: "Comments retrieved successfully",
    data: comments,
  })
}
