import type { Request, Response } from "express"
import { getPublicChapterPagesService, getPublicChapterService, getPublicSeriesService, recordReaderMetricsService } from "./public.service.js"

export async function getPublicSeries(req: Request, res: Response): Promise<void> {
  const series = await getPublicSeriesService(String(req.params.seriesSlug))
  res.json({ success: true, message: "Public series retrieved", data: series })
}

export async function getPublicChapter(req: Request, res: Response): Promise<void> {
  const chapter = await getPublicChapterService(String(req.params.chapterSlug))
  res.json({ success: true, message: "Public chapter retrieved", data: chapter })
}

export async function getPublicChapterPages(req: Request, res: Response): Promise<void> {
  const pages = await getPublicChapterPagesService(String(req.params.chapterId))
  res.json({ success: true, message: "Public chapter pages retrieved", data: pages })
}

export async function recordReaderMetrics(req: Request, res: Response): Promise<void> {
  const metrics = await recordReaderMetricsService({
    chapterId: req.body.chapterId,
    seriesId: req.body.seriesId,
    viewDurationSeconds: req.body.viewDurationSeconds,
    ipAddress: req.ip,
  })
  res.status(201).json({ success: true, message: "Reader metrics recorded", data: metrics })
}
