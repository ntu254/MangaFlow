import { Chapter, FileAsset, Page } from "../chapter.model.js"

export async function createPageRepository(chapterId: string, pageNumber: number): Promise<any> {
  const chapter = await Chapter.findById(chapterId)
  if (!chapter) {
    throw new Error("Chapter not found")
  }

  const existing = await Page.findOne({ chapterId, pageNumber })
  if (existing) {
    throw new Error(`Page ${pageNumber} already exists in this chapter`)
  }

  return Page.create({
    chapterId,
    pageNumber,
    status: "UPLOADING",
    regionIds: [],
  })
}

export async function getPagesByChapter(chapterId: string): Promise<any[]> {
  return Page.find({ chapterId }).sort({ pageNumber: 1 }).lean()
}

export async function getPageById(pageId: string): Promise<any | null> {
  return Page.findById(pageId)
}

export async function updatePageStatus(pageId: string, status: string): Promise<any | null> {
  return Page.findByIdAndUpdate(pageId, { status }, { new: true })
}

interface UploadAssetInput {
  fileAssetId: string
  r2Key: string
  originalName: string
  mimeType: string
  size: number
}

export interface ConfirmPageUploadInput {
  pageId: string
  uploadedBy: string
  original: UploadAssetInput
  working: UploadAssetInput
  thumbnail: UploadAssetInput
}

async function upsertFileAsset(input: UploadAssetInput, uploadedBy: string, slot: string) {
  return FileAsset.findByIdAndUpdate(
    input.fileAssetId,
    {
      _id: input.fileAssetId,
      originalName: input.originalName,
      mimeType: input.mimeType,
      size: input.size,
      r2Key: input.r2Key,
      r2Bucket: process.env.R2_BUCKET || "mangaflow",
      uploadedBy,
      assetType: "production",
      slot,
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  )
}

export async function confirmPageUploadRepository(input: ConfirmPageUploadInput): Promise<any> {
  const existingPage = await Page.findById(input.pageId)
  if (!existingPage) {
    throw new Error("Page not found")
  }

  const uploads = [
    { key: "originalAsset", slot: "ORIGINAL", asset: input.original },
    { key: "workingAsset", slot: "WORKING", asset: input.working },
    { key: "thumbnailAsset", slot: "THUMBNAIL", asset: input.thumbnail },
  ] as const

  const upsertedByFileAssetId = new Map<string, any>()
  for (const upload of uploads) {
    if (!upsertedByFileAssetId.has(upload.asset.fileAssetId)) {
      upsertedByFileAssetId.set(
        upload.asset.fileAssetId,
        await upsertFileAsset(upload.asset, input.uploadedBy, upload.slot),
      )
    }
  }

  const originalAsset = upsertedByFileAssetId.get(input.original.fileAssetId)
  const workingAsset = upsertedByFileAssetId.get(input.working.fileAssetId)
  const thumbnailAsset = upsertedByFileAssetId.get(input.thumbnail.fileAssetId)

  const page = await Page.findByIdAndUpdate(
    input.pageId,
    {
      status: "UPLOADED",
      originalFileAssetId: input.original.fileAssetId,
      workingFileAssetId: input.working.fileAssetId,
      thumbnailFileAssetId: input.thumbnail.fileAssetId,
    },
    { new: true },
  )

  if (!page) {
    throw new Error("Page not found")
  }

  try {
    if (existingPage.chapterId) {
      await Chapter.updateOne(
        { _id: existingPage.chapterId, status: "DRAFT" },
        { $set: { status: "IN_PRODUCTION" } },
      )
    }
  } catch {
    // Page upload confirmation must not fail because series lifecycle sync failed.
  }

  return { page, originalAsset, workingAsset, thumbnailAsset }
}

export async function markPageProcessingFailed(pageId: string): Promise<any | null> {
  return Page.findByIdAndUpdate(pageId, { status: "PROCESSING_FAILED" }, { new: true })
}

export async function getFileAssetById(fileAssetId: string): Promise<any | null> {
  return FileAsset.findById(fileAssetId)
}

export async function getPageWithFileAsset(pageId: string): Promise<any | null> {
  return Page.findById(pageId)
    .populate("originalFileAssetId")
    .populate("workingFileAssetId")
    .populate("thumbnailFileAssetId")
}
