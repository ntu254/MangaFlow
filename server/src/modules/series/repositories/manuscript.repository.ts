import { FileAsset } from "../../chapter/chapter.model.js"
import { config } from "../../../shared/utils/env.js"
import type { ManuscriptStatus } from "../../../shared/workflow/status.js"
import { Manuscript } from "../series.model.js"

export async function hasManuscript(seriesId: string): Promise<boolean> {
  const existing = await Manuscript.exists({ seriesId })
  return Boolean(existing)
}

export async function getLatestManuscriptBySeries(seriesId: string): Promise<any | null> {
  return Manuscript.findOne({ seriesId }).sort({ version: -1 })
}

function isDuplicateManuscriptVersionError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000 &&
      "keyPattern" in error &&
      typeof error.keyPattern === "object" &&
      error.keyPattern &&
      "seriesId" in error.keyPattern &&
      "version" in error.keyPattern,
  )
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export interface CreateManuscriptUploadDraftInput {
  seriesId: string
  uploadedBy: string
  r2Key: string
  originalName: string
  mimeType: string
  size: number
}

export async function createManuscriptUploadDraft(input: CreateManuscriptUploadDraftInput): Promise<any> {
  const fileAsset = await FileAsset.create({
    originalName: input.originalName,
    mimeType: input.mimeType,
    size: input.size,
    r2Key: input.r2Key,
    r2Bucket: config.r2Bucket,
    uploadedBy: input.uploadedBy,
  })

  let manuscript
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const latest = await getLatestManuscriptBySeries(input.seriesId)
    const version = latest ? latest.version + 1 : 1

    try {
      manuscript = await Manuscript.create({
        seriesId: input.seriesId,
        uploadedBy: input.uploadedBy,
        version,
        status: "DRAFT",
        fileAssetId: fileAsset.id,
      })
      break
    } catch (error) {
      if (!isDuplicateManuscriptVersionError(error) || attempt === 7) {
        throw error
      }
      await delay(20 * (attempt + 1))
    }
  }

  if (!manuscript) {
    throw new Error("Unable to create manuscript draft")
  }

  return { manuscript, fileAsset }
}

export async function updateManuscriptStatus(manuscriptId: string, status: ManuscriptStatus, reviewNote?: string): Promise<any | null> {
  return Manuscript.findByIdAndUpdate(manuscriptId, { status, reviewNote }, { new: true })
}
