import type { Request, Response } from "express"
import { getPageStudioService } from "./page.service.js"

export async function getPageStudio(req: Request, res: Response): Promise<void> {
  const data = await getPageStudioService(String(req.params.pageId), req.user!.userId, req.user!.role)
  res.json({ success: true, message: "Page studio retrieved", data })
}
