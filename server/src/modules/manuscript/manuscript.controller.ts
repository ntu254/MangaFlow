import type { Request, Response } from "express"
import { reviewManuscriptProposalService, type ProposalReviewAction } from "./manuscript.service.js"

async function respond(req: Request, res: Response, action: ProposalReviewAction, message: string) {
  const result = await reviewManuscriptProposalService(String(req.params.manuscriptId), action)
  res.json({ success: true, message, data: result })
}

export const requestRevision = (req: Request, res: Response) => respond(req, res, "REQUEST_REVISION", "Manuscript revision requested")
export const forwardToBoard = (req: Request, res: Response) => respond(req, res, "FORWARD_TO_BOARD", "Manuscript forwarded to Board")
export const reject = (req: Request, res: Response) => respond(req, res, "REJECT", "Manuscript proposal rejected")
