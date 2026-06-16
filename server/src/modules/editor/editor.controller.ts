import type { Request, Response } from "express"
import {
  forwardManuscriptToBoardService,
  getEditorSeriesReviewService,
  listEditorReviewQueueService,
  rejectManuscriptService,
  requestManuscriptRevisionService,
  startEditorReviewService,
} from "../manuscript/manuscript.service.js"

export async function listReviewQueue(req: Request, res: Response): Promise<void> {
  const data = await listEditorReviewQueueService(req.user!)
  res.json({ success: true, message: "Editor review queue retrieved", data })
}

export async function getSeriesReview(req: Request, res: Response): Promise<void> {
  const data = await getEditorSeriesReviewService(String(req.params.seriesId), req.user!)
  res.json({ success: true, message: "Series review retrieved", data })
}

export async function startSeriesReview(req: Request, res: Response): Promise<void> {
  const data = await startEditorReviewService(String(req.params.seriesId), req.user!)
  res.json({ success: true, message: "Editor review started", data })
}

export async function requestRevision(req: Request, res: Response): Promise<void> {
  const data = await requestManuscriptRevisionService({
    seriesId: String(req.params.seriesId),
    actor: req.user!,
    ...req.body,
  })
  res.json({ success: true, message: "Series revision requested", data })
}

export async function rejectSeries(req: Request, res: Response): Promise<void> {
  const data = await rejectManuscriptService({
    seriesId: String(req.params.seriesId),
    actor: req.user!,
    ...req.body,
  })
  res.json({ success: true, message: "Series rejected by Editor", data })
}

export async function forwardToBoard(req: Request, res: Response): Promise<void> {
  const data = await forwardManuscriptToBoardService({
    seriesId: String(req.params.seriesId),
    actor: req.user!,
    ...req.body,
  })
  res.json({ success: true, message: "Series forwarded to Board", data })
}
