import { deleteDraftSeriesService, withdrawSeriesProposalService, cancelSeriesService, hardDeleteSeriesService } from "./series.service.js"
import type { Request, Response } from "express"
import { createManuscriptUploadService, createSeriesService, getSeriesDetailService, listSeriesService, submitSeriesService, updateSeriesService, getSeriesSummaryService, deleteManuscriptFileService, downloadManuscriptFileService, verifyManuscriptFilesService, createCoverUploadUrlService } from "./series.service.js"
import { createChapterService } from "../chapter/chapter.service.js"

export async function listSeries(req: Request, res: Response): Promise<void> {
  const series = await listSeriesService(req.user!.userId, req.user!.role)
  res.json({ success: true, message: "Series retrieved successfully", data: series })
}

export async function getSeriesDetail(req: Request, res: Response): Promise<void> {
  const series = await getSeriesDetailService(String(req.params.seriesId), req.user!.userId, req.user!.role)
  res.json({ success: true, message: "Series retrieved successfully", data: series })
}

export async function getSeriesSummary(req: Request, res: Response): Promise<void> {
  const summary = await getSeriesSummaryService(String(req.params.seriesId), req.user!.userId, req.user!.role)
  res.json({ success: true, message: "Series summary retrieved successfully", data: summary })
}

export async function createSeries(req: Request, res: Response): Promise<void> {
  const series = await createSeriesService({ ...req.body, ownerId: req.user!.userId })
  res.status(201).json({ success: true, message: "Series created successfully", data: series })
}

export async function createChapterForSeries(req: Request, res: Response): Promise<void> {
  const chapter = await createChapterService({
    seriesId: String(req.params.seriesId),
    chapterNumber: req.body.chapterNumber,
    title: req.body.title,
  })
  res.status(201).json({ success: true, message: "Chapter created successfully", data: chapter })
}

export async function createManuscriptUpload(req: Request, res: Response): Promise<void> {
  const result = await createManuscriptUploadService({
    seriesId: String(req.params.seriesId),
    userId: req.user!.userId,
    originalName: req.body.originalName,
    contentType: req.body.contentType,
    size: req.body.size,
    expiresIn: req.body.expiresIn,
    assetType: req.body.assetType,
    slot: req.body.slot,
  })

  res.status(201).json({ success: true, message: "Manuscript upload URL created", data: result })
}

export async function createCoverUpload(req: Request, res: Response): Promise<void> {
  const result = await createCoverUploadUrlService({
    seriesId: String(req.params.seriesId),
    userId: req.user!.userId,
    originalName: req.body.originalName,
    contentType: req.body.contentType,
    expiresIn: req.body.expiresIn,
  })

  res.status(201).json({ success: true, message: "Cover upload URL created", data: result })
}

export async function submitSeries(req: Request, res: Response): Promise<void> {
  const series = await submitSeriesService(String(req.params.seriesId), req.user!.userId)
  res.json({ success: true, message: "Series submitted for editor review", data: series })
}


export async function updateSeries(req: Request, res: Response): Promise<void> {
  const series = await updateSeriesService({
    seriesId: String(req.params.seriesId),
    userId: req.user!.userId,
    patch: req.body,
  })
  res.json({ success: true, message: "Series updated successfully", data: series })
}

export async function deleteManuscriptFile(req: Request, res: Response): Promise<void> {
  await deleteManuscriptFileService(String(req.params.seriesId), String(req.params.fileAssetId), req.user!.userId, req.user!.role)
  res.json({ success: true, message: "File deleted successfully", data: null })
}

export async function downloadManuscriptFile(req: Request, res: Response): Promise<void> {
  const result = await downloadManuscriptFileService(String(req.params.seriesId), String(req.params.fileAssetId), req.user!.userId, req.user!.role)
  res.json({ success: true, message: "Download URL generated successfully", data: result })
}

export async function verifyManuscriptFiles(req: Request, res: Response): Promise<void> {
  const result = await verifyManuscriptFilesService(String(req.params.seriesId), req.user!.userId, req.user!.role)
  res.json({ success: true, message: "Files verified successfully", data: result })
}

export async function deleteDraftSeries(req: Request, res: Response): Promise<void> {
  await deleteDraftSeriesService(String(req.params.seriesId), req.user!.userId, req.user!.role)
  res.json({ success: true, message: "Draft deleted successfully" })
}

export async function withdrawSeriesProposal(req: Request, res: Response): Promise<void> {
  await withdrawSeriesProposalService(String(req.params.seriesId), req.user!.userId, req.user!.role)
  res.json({ success: true, message: "Proposal withdrawn successfully" })
}

export async function cancelSeries(req: Request, res: Response): Promise<void> {
  await cancelSeriesService(String(req.params.seriesId), req.user!.userId, req.user!.role)
  res.json({ success: true, message: "Series cancelled successfully" })
}

export async function hardDeleteSeries(req: Request, res: Response): Promise<void> {
  await hardDeleteSeriesService(String(req.params.seriesId), req.user!.userId, req.user!.role)
  res.json({ success: true, message: "Series hard deleted successfully" })
}
