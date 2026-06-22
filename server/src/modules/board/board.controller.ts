import type { Request, Response } from "express"
import { castBoardVoteService, createAtRiskDecisionService, finalizeBoardDecisionService, listAtRiskDecisionHistoryService, listCancellationCasesService, listDecisionHistoryService, listBoardQueueService, listPublishingScheduleService, savePublishingScheduleService, tieBreakBoardDecisionService } from "./board.service.js"


export async function listQueue(_req: Request, res: Response): Promise<void> {
  const data = await listBoardQueueService()
  res.json({ success: true, message: "Board queue retrieved", data })
}

export async function castVote(req: Request, res: Response): Promise<void> {
  const data = await castBoardVoteService(String(req.params.seriesId), req.user!.userId, req.body.value, req.body.note)
  res.status(201).json({ success: true, message: "Board vote recorded", data })
}

export async function finalizeDecision(req: Request, res: Response): Promise<void> {
  const data = await finalizeBoardDecisionService(String(req.params.seriesId), req.user!.userId, req.body)
  res.json({ success: true, message: "Board decision finalized", data })
}

export async function tieBreakDecision(req: Request, res: Response): Promise<void> {
  const data = await tieBreakBoardDecisionService(String(req.params.seriesId), req.user!.userId, req.body)
  res.json({ success: true, message: "Board tie-break finalized", data })
}


export async function createAtRiskDecision(req: Request, res: Response): Promise<void> {
  const data = await createAtRiskDecisionService(String(req.params.seriesId), req.user!.userId, req.body.decision, req.body.note)
  res.status(201).json({ success: true, message: "At-risk decision recorded", data })
}

export async function listPublishingSchedule(_req: Request, res: Response): Promise<void> {
  const data = await listPublishingScheduleService()
  res.json({ success: true, message: "Board publishing schedule retrieved", data })
}

export async function savePublishingSchedule(req: Request, res: Response): Promise<void> {
  const data = await savePublishingScheduleService(String(req.params.seriesId), req.user!.userId, req.body)
  res.json({ success: true, message: "Board publishing schedule saved", data })
}

export async function listCancellationCases(_req: Request, res: Response): Promise<void> {
  const data = await listCancellationCasesService()
  res.json({ success: true, message: "Board cancellation cases retrieved", data })
}

export async function listAtRiskDecisions(req: Request, res: Response): Promise<void> {
  const data = await listAtRiskDecisionHistoryService(String(req.params.seriesId))
  res.json({ success: true, message: "At-risk decisions retrieved", data })
}

export async function listDecisionHistory(req: Request, res: Response): Promise<void> {
  const type = typeof req.query.type === "string" ? req.query.type : "all"
  const data = await listDecisionHistoryService(type)
  res.json({ success: true, message: "Board decision history retrieved", data })
}
