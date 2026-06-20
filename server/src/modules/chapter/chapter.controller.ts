import { Request, Response } from "express"
import { deleteChapterService, cancelChapterService, deletePageService, replacePageAssetService } from "./chapter.service.js"
export * from "./controllers/chapter-lifecycle.controller.js"
export * from "./controllers/page.controller.js"
export * from "./controllers/chapter-readiness.controller.js"

export async function deleteChapter(req: Request, res: Response): Promise<void> {
  await deleteChapterService(String(req.params.chapterId), req.user!)
  res.json({ success: true, message: "Chapter deleted successfully" })
}

export async function cancelChapter(req: Request, res: Response): Promise<void> {
  await cancelChapterService(String(req.params.chapterId), req.user!)
  res.json({ success: true, message: "Chapter cancelled successfully" })
}

export async function deletePage(req: Request, res: Response): Promise<void> {
  await deletePageService(String(req.params.chapterId), String(req.params.pageId), req.user!)
  res.json({ success: true, message: "Page deleted successfully" })
}

export async function replacePage(req: Request, res: Response): Promise<void> {
  const { originalFileAssetId } = req.body
  await replacePageAssetService(String(req.params.chapterId), String(req.params.pageId), originalFileAssetId, req.user!)
  res.json({ success: true, message: "Page replaced successfully" })
}
