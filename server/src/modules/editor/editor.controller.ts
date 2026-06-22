import type { Request, Response } from "express"
import {
  forwardManuscriptToBoardService,
  getEditorSeriesReviewService,
  listEditorReviewQueueService,
  rejectManuscriptService,
  requestManuscriptRevisionService,
  startEditorReviewService,
} from "../manuscript/manuscript.service.js"
import {
  listEditorActivityService,
  listEditorDecisionHistoryService,
  listEditorManagedSeriesService,
  listEditorProductionProgressService,
  listEditorRankingRiskService,
} from "./editor-workspace.service.js"

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

export async function listManagedSeries(req: Request, res: Response): Promise<void> {
  const data = await listEditorManagedSeriesService(req.user!)
  res.json({ success: true, message: "Editor managed series retrieved", data })
}

export async function listProductionProgress(req: Request, res: Response): Promise<void> {
  const data = await listEditorProductionProgressService(req.user!)
  res.json({ success: true, message: "Editor production progress retrieved", data })
}

export async function listRankingRisk(req: Request, res: Response): Promise<void> {
  const data = await listEditorRankingRiskService(req.user!)
  res.json({ success: true, message: "Editor ranking risk retrieved", data })
}

export async function listDecisionHistory(req: Request, res: Response): Promise<void> {
  const data = await listEditorDecisionHistoryService(req.user!)
  res.json({ success: true, message: "Editor decision history retrieved", data })
}

export async function listActivity(req: Request, res: Response): Promise<void> {
  const data = await listEditorActivityService(req.user!)
  res.json({ success: true, message: "Editor activity retrieved", data })
}
