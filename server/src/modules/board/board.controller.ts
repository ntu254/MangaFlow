import type { Request, Response } from "express"
import { castBoardVoteService, finalizeBoardDecisionService, listBoardQueueService, tieBreakBoardDecisionService } from "./board.service.js"


export async function listQueue(_req: Request, res: Response): Promise<void> {
  const data = await listBoardQueueService()
  res.json({ success: true, message: "Board queue retrieved", data })
}

export async function castVote(req: Request, res: Response): Promise<void> {
  const data = await castBoardVoteService(String(req.params.seriesId), req.user!.userId, req.body.value)
  res.status(201).json({ success: true, message: "Board vote recorded", data })
}

export async function finalizeDecision(req: Request, res: Response): Promise<void> {
  const data = await finalizeBoardDecisionService(String(req.params.seriesId), req.user!.userId)
  res.json({ success: true, message: "Board decision finalized", data })
}

export async function tieBreakDecision(req: Request, res: Response): Promise<void> {
  const data = await tieBreakBoardDecisionService(String(req.params.seriesId), req.user!.userId, req.body.value)
  res.json({ success: true, message: "Board tie-break finalized", data })
}
