import type { NextFunction, Request, Response } from "express"
import { getChapterReadinessService, markChapterReadyService } from "../chapter.service.js"

export async function getChapterReadiness(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const readiness = await getChapterReadinessService(String(req.params.chapterId))
  res.json({ success: true, message: "Chapter readiness retrieved successfully", data: readiness })
}

export async function markChapterReady(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const chapter = await markChapterReadyService(String(req.params.chapterId))
  res.json({ success: true, message: "Chapter marked as ready for publication", data: chapter })
}
