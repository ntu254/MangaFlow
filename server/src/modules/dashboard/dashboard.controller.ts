import type { Request, Response } from "express"
import { 
  getAdminSidebarSummaryService,
  getMangakaSummaryService,
  getAssistantSummaryService,
  getEditorSummaryService,
  getBoardSummaryService
} from "./dashboard.service.js"

export async function getAdminSidebarSummary(_req: Request, res: Response): Promise<void> {
  const data = await getAdminSidebarSummaryService()
  res.json({ success: true, message: "Admin dashboard summary retrieved", data })
}

export async function getMangakaSummary(req: Request, res: Response): Promise<void> {
  const data = await getMangakaSummaryService(req.user!.userId)
  res.json({ success: true, message: "Mangaka dashboard summary retrieved", data })
}

export async function getAssistantSummary(req: Request, res: Response): Promise<void> {
  const data = await getAssistantSummaryService(req.user!.userId)
  res.json({ success: true, message: "Assistant dashboard summary retrieved", data })
}

export async function getEditorSummary(req: Request, res: Response): Promise<void> {
  const data = await getEditorSummaryService(req.user!.userId)
  res.json({ success: true, message: "Editor dashboard summary retrieved", data })
}

export async function getBoardSummary(req: Request, res: Response): Promise<void> {
  const data = await getBoardSummaryService(req.user!.userId)
  res.json({ success: true, message: "Board dashboard summary retrieved", data })
}
