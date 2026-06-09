import type { NextFunction, Request, Response } from "express"
import { createPageService, listPagesService } from "../chapter.service.js"

export async function createPage(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const page = await createPageService(String(req.params.chapterId), req.body.pageNumber)
  res.status(201).json({ success: true, message: "Page created successfully", data: page })
}

export async function listPages(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const pages = await listPagesService(String(req.params.chapterId))
  res.json({ success: true, message: "Pages retrieved successfully", data: pages })
}
