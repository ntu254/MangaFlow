import type { Request, Response } from "express"
import {
  forwardManuscriptToBoardService,
  rejectManuscriptService,
  requestManuscriptRevisionService,
} from "./manuscript.service.js"

export async function requestRevision(req: Request, res: Response): Promise<void> {
  const manuscript = await requestManuscriptRevisionService({
    manuscriptId: String(req.params.manuscriptId),
    actor: req.user!,
    reviewNote: req.body.reviewNote,
  })
  res.json({ success: true, message: "Manuscript revision requested", data: manuscript })
}

export async function forwardToBoard(req: Request, res: Response): Promise<void> {
  const manuscript = await forwardManuscriptToBoardService({
    manuscriptId: String(req.params.manuscriptId),
    actor: req.user!,
    reviewNote: req.body.reviewNote,
  })
  res.json({ success: true, message: "Manuscript forwarded to Board", data: manuscript })
}

export async function reject(req: Request, res: Response): Promise<void> {
  const manuscript = await rejectManuscriptService({
    manuscriptId: String(req.params.manuscriptId),
    actor: req.user!,
    reviewNote: req.body.reviewNote,
  })
  res.json({ success: true, message: "Manuscript rejected", data: manuscript })
}
