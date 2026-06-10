import type { NextFunction, Request, Response } from "express"
import {
  createChapterService,
  getChapterService,
  listChaptersService,
  updateChapterStatusService,
} from "../chapter.service.js"

export async function createChapter(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const chapter = await createChapterService({
    seriesId: req.body.seriesId,
    chapterNumber: req.body.chapterNumber,
    title: req.body.title,
  })

  res.status(201).json({ success: true, message: "Chapter created successfully", data: chapter })
}

export async function listChapters(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const chapters = await listChaptersService(String(req.params.seriesId))
  res.json({ success: true, message: "Chapters retrieved successfully", data: chapters })
}

export async function getChapter(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const actor = { userId: req.user!.userId, role: req.user!.role }
  const chapter = await getChapterService(String(req.params.chapterId), actor)
  res.json({ success: true, message: "Chapter retrieved successfully", data: chapter })
}

export async function updateChapterStatus(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const actor = { userId: req.user!.userId, role: req.user!.role }
  const chapter = await updateChapterStatusService(String(req.params.chapterId), req.body.status, actor)
  res.json({ success: true, message: "Chapter status updated successfully", data: chapter })
}