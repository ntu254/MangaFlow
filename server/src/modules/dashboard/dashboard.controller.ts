import type { Request, Response } from "express"
import { getAdminSidebarSummaryService } from "./dashboard.service.js"

export async function getAdminSidebarSummary(_req: Request, res: Response): Promise<void> {
  const data = await getAdminSidebarSummaryService()
  res.json({ success: true, message: "Admin dashboard summary retrieved", data })
}
