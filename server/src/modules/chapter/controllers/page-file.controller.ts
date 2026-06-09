import type { NextFunction, Request, Response } from "express"
import {
  confirmPageUploadService,
  getPageWithFileAssetService,
  getPresignedDownloadUrlService,
  getPresignedUploadUrlService,
} from "../chapter.service.js"

export async function getPresignedUploadUrl(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const result = await getPresignedUploadUrlService({
    originalName: req.body.originalName,
    contentType: req.body.contentType,
    expiresIn: req.body.expiresIn,
  })

  res.json({ success: true, message: "Presigned upload URL generated", data: result })
}

export async function confirmPageUpload(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const result = await confirmPageUploadService({
    pageId: String(req.params.pageId),
    fileAssetId: req.body.fileAssetId,
    r2Key: req.body.r2Key,
    originalName: req.body.originalName,
    mimeType: req.body.mimeType,
    size: req.body.size,
    userId: req.user!.userId,
  })

  res.json({ success: true, message: "Page upload confirmed", data: result })
}

export async function getPresignedDownloadUrl(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const result = await getPresignedDownloadUrlService(String(req.params.fileAssetId), req.user!)
  res.json({ success: true, message: "Presigned download URL generated", data: result })
}

export async function getPageWithFileAsset(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const page = await getPageWithFileAssetService(String(req.params.pageId), req.user!)
  res.json({ success: true, message: "Page retrieved with file asset", data: page })
}
