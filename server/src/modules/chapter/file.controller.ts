import type { NextFunction, Request, Response } from "express"
import {
  getPresignedUploadUrlService,
  confirmPageUploadService,
  getPresignedDownloadUrlService,
  getPageWithFileAssetService,
  createRegionService,
  listRegionsService,
  getRegionService,
  updateRegionStatusService,
  deleteRegionService,
} from "./chapter.service.js"

export async function getPresignedUploadUrl(
  req: Request & { user?: { userId: string; role: string } },
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const result = await getPresignedUploadUrlService({
    originalName: req.body.originalName,
    contentType: req.body.contentType,
    expiresIn: req.body.expiresIn,
  })

  res.json({
    success: true,
    message: "Presigned upload URL generated",
    data: result,
  })
}

export async function confirmPageUpload(
  req: Request & { user?: { userId: string; role: string } },
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const result = await confirmPageUploadService({
    pageId: String(req.params.pageId),
    fileAssetId: req.body.fileAssetId,
    r2Key: req.body.r2Key,
    originalName: req.body.originalName,
    mimeType: req.body.mimeType,
    size: req.body.size,
    userId: req.user!.userId,
  })

  res.json({
    success: true,
    message: "Page upload confirmed",
    data: result,
  })
}

export async function getPresignedDownloadUrl(
  req: Request & { user?: { userId: string; role: string } },
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const result = await getPresignedDownloadUrlService(String(req.params.fileAssetId))

  res.json({
    success: true,
    message: "Presigned download URL generated",
    data: result,
  })
}

export async function getPageWithFileAsset(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const page = await getPageWithFileAssetService(String(req.params.pageId))

  res.json({
    success: true,
    message: "Page retrieved with file asset",
    data: page,
  })
}

export async function createRegion(
  req: Request & { user?: { userId: string; role: string } },
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const region = await createRegionService({
    pageId: String(req.params.pageId),
    regionIndex: req.body.regionIndex,
    bbox: req.body.bbox,
  })

  res.status(201).json({
    success: true,
    message: "Region created successfully",
    data: region,
  })
}

export async function listRegions(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const regions = await listRegionsService(String(req.params.pageId))

  res.json({
    success: true,
    message: "Regions retrieved successfully",
    data: regions,
  })
}

export async function getRegion(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const region = await getRegionService(String(req.params.regionId))

  res.json({
    success: true,
    message: "Region retrieved successfully",
    data: region,
  })
}

export async function updateRegionStatus(
  req: Request & { user?: { userId: string; role: string } },
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const region = await updateRegionStatusService(String(req.params.regionId), req.body.status)

  res.json({
    success: true,
    message: "Region status updated successfully",
    data: region,
  })
}

export async function deleteRegion(
  req: Request & { user?: { userId: string; role: string } },
  res: Response,
  _next: NextFunction,
): Promise<void> {
  await deleteRegionService(String(req.params.regionId))

  res.json({
    success: true,
    message: "Region deleted successfully",
    data: null,
  })
}