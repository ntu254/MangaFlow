import type { NextFunction, Request, Response } from "express"
import {
  confirmPageUploadService,
  getFileAssetContentService,
  getPageWithFileAssetService,
  getPresignedDownloadUrlService,
  getPresignedUploadUrlService,
} from "../chapter.service.js"

export async function getPresignedUploadUrl(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const actor = { userId: req.user!.userId, role: req.user!.role }
  const result = await getPresignedUploadUrlService({
    originalName: req.body.originalName,
    contentType: req.body.contentType,
    expiresIn: req.body.expiresIn,
    chapterId: req.body.chapterId,
    actor,
  })
  res.json({ success: true, message: "Presigned upload URL generated", data: result })
}

export async function confirmPageUpload(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const actor = { userId: req.user!.userId, role: req.user!.role }
  const result = await confirmPageUploadService({
    pageId: String(req.params.pageId),
    original: req.body.original,
    working: req.body.working,
    thumbnail: req.body.thumbnail,
    userId: req.user!.userId,
    actor,
  })
  res.json({ success: true, message: "Page upload confirmed", data: result })
}

export async function getPresignedDownloadUrl(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const actor = { userId: req.user!.userId, role: req.user!.role }
  const result = await getPresignedDownloadUrlService(
    String(req.params.fileAssetId),
    actor,
    req.query.expiresIn ? Number(req.query.expiresIn) : undefined,
  )
  res.json({ success: true, message: "Presigned download URL generated", data: result })
}

export async function getFileAssetContent(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const actor = { userId: req.user!.userId, role: req.user!.role }
  const result = await getFileAssetContentService(String(req.params.fileAssetId), actor)
  res.setHeader("Content-Type", result.mimeType)
  res.setHeader("Content-Length", String(result.buffer.length))
  res.setHeader("Cache-Control", "private, max-age=300")
  res.setHeader("Content-Disposition", `inline; filename="${safeHeaderFilename(result.originalName)}"`)
  res.end(result.buffer)
}

export async function getPageWithFileAsset(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const actor = { userId: req.user!.userId, role: req.user!.role }
  const page = await getPageWithFileAssetService(String(req.params.pageId), actor)
  res.json({ success: true, message: "Page with file assets retrieved", data: page })
}

function safeHeaderFilename(value: string) {
  return value.replace(/["\r\n]/g, "_")
}
