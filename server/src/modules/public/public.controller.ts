import type { Request, Response } from "express"
import { getPublicChapterPagesService, getPublicChapterService, getPublicSeriesService, recordReaderMetricsService } from "./public.service.js"
import { getFileStream } from "../chapter/file.service.js"

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

export async function getPublicImage(req: Request, res: Response) {
  const r2Key = req.params[0]
  if (!r2Key) {
    res.status(400).json({ success: false, message: "Image key is required" })
    return
  }
  
  try {
    const { stream, contentType, contentLength } = await getFileStream(r2Key)
    if (contentType) res.setHeader("Content-Type", contentType)
    if (contentLength) res.setHeader("Content-Length", contentLength)
    res.setHeader("Cache-Control", "public, max-age=31536000") // cache for 1 year
    ;(stream as any).pipe(res)
  } catch (error) {
    res.status(404).json({ success: false, message: "Image not found" })
  }
}
