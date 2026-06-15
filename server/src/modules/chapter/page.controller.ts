import type { Request, Response } from "express"
import { getPageWorkspaceService } from "./page.service.js"

export async function getPageWorkspace(req: Request, res: Response): Promise<void> {
  const data = await getPageWorkspaceService(String(req.params.pageId), req.user!.userId, req.user!.role)
  res.json({ success: true, message: "Page workspace retrieved", data })
}
