import { AppError } from "../../../shared/errors/AppError.js"
import { config } from "../../../shared/utils/env.js"
import { Page, FileAsset, type RegionType } from "../chapter.model.js"
import sharp from "sharp"
import {
  createAIResultRepository,
  getAIResultByIdRepository,
  getAIResultsByPageRepository,
  updateAIResultRepository,
  createRegionRepository,
  nextRegionIndex,
} from "../chapter.repository.js"
import { getFileBuffer, uploadBuffer } from "../file.service.js"
import { assertCanReadPage, assertCanWritePage, type AccessActor } from "../../../shared/policies/accessPolicy.service.js"

const AI_SERVICE_URL = config.aiServiceUrl ?? "http://127.0.0.1:8000"
const STUDIO_IMAGE_WIDTH = 800
const STUDIO_IMAGE_HEIGHT = 1131

interface AIBubbleResponse {
  bubble_count: number
  bubbles: Array<{
    id: number
    bbox: { x: number; y: number; width: number; height: number }
    confidence: number
    has_mask: boolean
  }>
}

function mapBubbleType(): RegionType {
  return "BUBBLE"
}

function asErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  return String(error || "AI segmentation failed")
}

export async function runAISegmentationService(pageId: string, actor: AccessActor) {
  const trimmed = pageId.trim()
  if (!trimmed) throw new AppError("Page id is required", 400)
  await assertCanWritePage(actor, trimmed)

  const page = await Page.findById(trimmed)
  if (!page) throw new AppError("Page not found", 404)
  // Flow-04: AI segmentation requires UPLOADED status (workingFileAssetId present).
  if (page.status === "UPLOADING" || page.status === "PROCESSING_FAILED") {
    throw new AppError(`AI segmentation unavailable: page status is ${page.status}`, 409)
  }
  if (!page.workingFileAssetId) {
    throw new AppError("Working image is required before running AI segmentation", 409)
  }

  const workingAsset = await FileAsset.findById(page.workingFileAssetId)
  if (!workingAsset) throw new AppError("Working file asset not found", 404)

  // Create a PENDING AIResult against the working image (spec: AI uses workingFileAssetId)
  const aiResult = await createAIResultRepository({
    pageId: trimmed,
    workingFileAssetId: String(page.workingFileAssetId),
    requestedBy: actor.userId,
    modelName: "bubble-detect",
    status: "PENDING",
  })

  try {
    const buffer = await getFileBuffer(workingAsset.r2Key)
    const metadata = await sharp(buffer).metadata()
    const sourceWidth = metadata.width || STUDIO_IMAGE_WIDTH
    const sourceHeight = metadata.height || STUDIO_IMAGE_HEIGHT
    const scaleX = STUDIO_IMAGE_WIDTH / sourceWidth
    const scaleY = STUDIO_IMAGE_HEIGHT / sourceHeight

    const formData = new FormData()
    formData.append("file", new Blob([buffer], { type: workingAsset.mimeType }), workingAsset.originalName)

    const response = await fetch(`${AI_SERVICE_URL}/bubble/detect`, { method: "POST", body: formData })
    if (!response.ok) {
      const body = await response.text().catch(() => "")
      throw new Error(`AI service responded with ${response.status}${body ? `: ${body.slice(0, 200)}` : ""}`)
    }

    const data = (await response.json()) as AIBubbleResponse
    if (!Array.isArray(data.bubbles)) {
      throw new Error("AI service response did not include bubbles")
    }
    const suggestions = data.bubbles.map((bubble, idx) => ({
      suggestionIndex: idx,
      type: mapBubbleType(),
      bbox: {
        x: Math.round(bubble.bbox.x * scaleX),
        y: Math.round(bubble.bbox.y * scaleY),
        width: Math.max(1, Math.round(bubble.bbox.width * scaleX)),
        height: Math.max(1, Math.round(bubble.bbox.height * scaleY)),
      },
      confidence: bubble.confidence,
      decision: "PENDING" as const,
    }))

    const updated = await updateAIResultRepository(String(aiResult._id), {
      status: "COMPLETED",
      suggestions,
    })
    return updated
  } catch (error) {
    await updateAIResultRepository(String(aiResult._id), {
      status: "FAILED",
      error: asErrorMessage(error),
    })
    throw new AppError(`AI segmentation failed: ${asErrorMessage(error)}`, 502)
  }
}

export async function runAITextWhiteningService(pageId: string, actor: AccessActor) {
  const trimmed = pageId.trim()
  if (!trimmed) throw new AppError("Page id is required", 400)
  await assertCanWritePage(actor, trimmed)

  const page = await Page.findById(trimmed)
  if (!page) throw new AppError("Page not found", 404)
  if (page.status === "UPLOADING" || page.status === "PROCESSING_FAILED") {
    throw new AppError(`AI text whitening unavailable: page status is ${page.status}`, 409)
  }
  if (!page.workingFileAssetId) {
    throw new AppError("Working image is required before running AI text whitening", 409)
  }

  const workingAsset = await FileAsset.findById(page.workingFileAssetId)
  if (!workingAsset) throw new AppError("Working file asset not found", 404)

  try {
    const buffer = await getFileBuffer(workingAsset.r2Key)
    const formData = new FormData()
    formData.append("file", new Blob([buffer], { type: workingAsset.mimeType }), workingAsset.originalName)

    const response = await fetch(`${AI_SERVICE_URL}/bubble/whiten`, { method: "POST", body: formData })
    if (!response.ok) {
      const body = await response.text().catch(() => "")
      throw new Error(`AI service responded with ${response.status}${body ? `: ${body.slice(0, 200)}` : ""}`)
    }

    const mimeType = response.headers.get("content-type")?.split(";")[0] || workingAsset.mimeType
    const resultBuffer = Buffer.from(await response.arrayBuffer())
    const extension = mimeType === "image/webp" ? "webp" : mimeType === "image/png" ? "png" : "jpg"
    const uploaded = await uploadBuffer(resultBuffer, `whitened-${trimmed}.${extension}`, mimeType)
    const fileAsset = await FileAsset.create({
      _id: uploaded.fileAssetId,
      originalName: `whitened-${workingAsset.originalName}`,
      mimeType,
      size: uploaded.size,
      r2Key: uploaded.r2Key,
      r2Bucket: config.r2Bucket,
      uploadedBy: actor.userId,
      assetType: "PRODUCTION",
      slot: "AI_WHITENED",
    })

    await Page.findByIdAndUpdate(trimmed, {
      workingFileAssetId: fileAsset._id,
      $addToSet: { variantFileAssetIds: fileAsset._id },
    })

    return fileAsset
  } catch (error) {
    throw new AppError(`AI text whitening failed: ${asErrorMessage(error)}`, 502)
  }
}

export async function listAIResultsService(pageId: string, actor: AccessActor) {
  const trimmed = pageId.trim()
  if (!trimmed) throw new AppError("Page id is required", 400)
  await assertCanReadPage(actor, trimmed)
  return getAIResultsByPageRepository(trimmed)
}

function recomputeAIResultStatus(suggestions: Array<{ decision: string }>): "COMPLETED" | "PARTIALLY_ACCEPTED" {
  const hasAccepted = suggestions.some((s) => s.decision === "ACCEPTED")
  const allDecided = suggestions.every((s) => s.decision !== "PENDING")
  if (hasAccepted && !allDecided) return "PARTIALLY_ACCEPTED"
  return "COMPLETED"
}

export async function acceptAISuggestionService(input: { aiResultId: string; suggestionIndex: number; actor: AccessActor }) {
  const trimmed = input.aiResultId.trim()
  if (!trimmed) throw new AppError("AI result id is required", 400)

  const aiResult = await getAIResultByIdRepository(trimmed)
  if (!aiResult) throw new AppError("AI result not found", 404)

  await assertCanWritePage(input.actor, String(aiResult.pageId))

  const suggestion = aiResult.suggestions.find((s) => s.suggestionIndex === input.suggestionIndex)
  if (!suggestion) throw new AppError("Suggestion not found", 404)
  if (suggestion.decision === "ACCEPTED" && suggestion.regionId) {
    throw new AppError("Suggestion already accepted", 409)
  }

  const regionIndex = await nextRegionIndex(String(aiResult.pageId))
  const region = await createRegionRepository({
    pageId: String(aiResult.pageId),
    regionIndex,
    type: suggestion.type,
    bbox: suggestion.bbox,
    source: "AI",
    status: "ACCEPTED",
    aiResultId: trimmed,
    confidence: suggestion.confidence,
  })

  suggestion.decision = "ACCEPTED"
  suggestion.regionId = region._id
  aiResult.status = recomputeAIResultStatus(aiResult.suggestions)
  await aiResult.save()

  return { aiResult, region }
}

export async function rejectAISuggestionService(input: { aiResultId: string; suggestionIndex: number; actor: AccessActor }) {
  const trimmed = input.aiResultId.trim()
  if (!trimmed) throw new AppError("AI result id is required", 400)

  const aiResult = await getAIResultByIdRepository(trimmed)
  if (!aiResult) throw new AppError("AI result not found", 404)

  await assertCanWritePage(input.actor, String(aiResult.pageId))

  const suggestion = aiResult.suggestions.find((s) => s.suggestionIndex === input.suggestionIndex)
  if (!suggestion) throw new AppError("Suggestion not found", 404)
  if (suggestion.decision === "ACCEPTED") {
    throw new AppError("Cannot reject an already accepted suggestion", 409)
  }

  suggestion.decision = "REJECTED"
  aiResult.status = recomputeAIResultStatus(aiResult.suggestions)
  await aiResult.save()

  return aiResult
}

