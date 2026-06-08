import type { NextFunction, Request, Response } from "express"
import {
  createChapterService,
  listChaptersService,
  getChapterService,
  updateChapterStatusService,
  createPageService,
  listPagesService,
} from "./chapter.service.js"

export async function createChapter(
  req: Request & { user?: { userId: string; role: string } },
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const chapter = await createChapterService({
    seriesId: req.body.seriesId,
    chapterNumber: req.body.chapterNumber,
    title: req.body.title,
  })

  res.status(201).json({
    success: true,
    message: "Chapter created successfully",
    data: chapter,
  })
}

export async function listChapters(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const seriesId = String(req.params.seriesId)
  const chapters = await listChaptersService(seriesId)

  res.json({
    success: true,
    message: "Chapters retrieved successfully",
    data: chapters,
  })
}

export async function getChapter(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const chapterId = String(req.params.chapterId)
  const chapter = await getChapterService(chapterId)

  res.json({
    success: true,
    message: "Chapter retrieved successfully",
    data: chapter,
  })
}

export async function updateChapterStatus(
  req: Request & { user?: { userId: string; role: string } },
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const chapterId = String(req.params.chapterId)
  const chapter = await updateChapterStatusService(chapterId, req.body.status)

  res.json({
    success: true,
    message: "Chapter status updated successfully",
    data: chapter,
  })
}

export async function createPage(
  req: Request & { user?: { userId: string; role: string } },
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const chapterId = String(req.params.chapterId)
  const page = await createPageService(chapterId, req.body.pageNumber)

  res.status(201).json({
    success: true,
    message: "Page created successfully",
    data: page,
  })
}

export async function listPages(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const chapterId = String(req.params.chapterId)
  const pages = await listPagesService(chapterId)

  res.json({
    success: true,
    message: "Pages retrieved successfully",
    data: pages,
  })
}