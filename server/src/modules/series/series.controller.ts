import type { Request, Response } from "express"
import { createManuscriptUploadService, createSeriesService, getSeriesDetailService, listSeriesService, submitSeriesService } from "./series.service.js"

export async function listSeries(req: Request, res: Response): Promise<void> {
  const series = await listSeriesService(req.user!.userId, req.user!.role)
  res.json({ success: true, message: "Series retrieved successfully", data: series })
}

export async function getSeriesDetail(req: Request, res: Response): Promise<void> {
  const series = await getSeriesDetailService(String(req.params.seriesId), req.user!.userId, req.user!.role)
  res.json({ success: true, message: "Series retrieved successfully", data: series })
}

export async function createSeries(req: Request, res: Response): Promise<void> {
  const series = await createSeriesService({ ...req.body, ownerId: req.user!.userId })
  res.status(201).json({ success: true, message: "Series created successfully", data: series })
}

export async function createManuscriptUpload(req: Request, res: Response): Promise<void> {
  const result = await createManuscriptUploadService({
    seriesId: String(req.params.seriesId),
    userId: req.user!.userId,
    originalName: req.body.originalName,
    contentType: req.body.contentType,
    size: req.body.size,
    expiresIn: req.body.expiresIn,
  })

  res.status(201).json({ success: true, message: "Manuscript upload URL created", data: result })
}

export async function submitSeries(req: Request, res: Response): Promise<void> {
  const series = await submitSeriesService(String(req.params.seriesId), req.user!.userId)
  res.json({ success: true, message: "Series submitted for editor review", data: series })
}
