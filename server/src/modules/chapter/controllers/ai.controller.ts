import type { NextFunction, Request, Response } from "express"
import {
  runAISegmentationService,
  runAITextWhiteningService,
  listAIResultsService,
  acceptAISuggestionService,
  rejectAISuggestionService,
} from "../chapter.service.js"

function actorOf(req: Request) {
  return { userId: req.user!.userId, role: req.user!.role }
}

export async function runAISegmentation(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const aiResult = await runAISegmentationService(String(req.params.pageId), actorOf(req))
  res.status(201).json({ success: true, message: "AI segmentation completed", data: aiResult })
}

export async function runAITextWhitening(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const fileAsset = await runAITextWhiteningService(String(req.params.pageId), actorOf(req))
  res.status(201).json({ success: true, message: "AI text whitening completed", data: fileAsset })
}

export async function listAIResults(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const results = await listAIResultsService(String(req.params.pageId), actorOf(req))
  res.json({ success: true, message: "AI results retrieved", data: results })
}

export async function acceptAISuggestion(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const result = await acceptAISuggestionService({
    aiResultId: String(req.params.aiResultId),
    suggestionIndex: req.body.suggestionIndex,
    actor: actorOf(req),
  })
  res.status(201).json({ success: true, message: "AI suggestion accepted", data: result })
}

export async function rejectAISuggestion(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const result = await rejectAISuggestionService({
    aiResultId: String(req.params.aiResultId),
    suggestionIndex: req.body.suggestionIndex,
    actor: actorOf(req),
  })
  res.json({ success: true, message: "AI suggestion rejected", data: result })
}
