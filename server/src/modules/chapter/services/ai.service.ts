import { AppError } from "../../../shared/errors/AppError.js"
import { config } from "../../../shared/utils/env.js"
import { Page, FileAsset, type RegionType } from "../chapter.model.js"
import {
  createAIResultRepository,
  getAIResultByIdRepository,
  getAIResultsByPageRepository,
  updateAIResultRepository,
  createRegionRepository,
  nextRegionIndex,
} from "../chapter.repository.js"
import { getFileBuffer } from "../file.service.js"
import { assertCanReadPage, assertCanWritePage, type AccessActor } from "../../../shared/policies/accessPolicy.service.js"

const AI_SERVICE_URL = config.aiServiceUrl ?? "http://127.0.0.1:8000"

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
    const formData = new FormData()
    formData.append("file", new Blob([buffer], { type: workingAsset.mimeType }), workingAsset.originalName)

    const response = await fetch(`${AI_SERVICE_URL}/bubble/detect`, { method: "POST", body: formData })
    if (!response.ok) throw new Error(`AI service responded with ${response.status}`)

    const data = (await response.json()) as AIBubbleResponse
    const suggestions = data.bubbles.map((bubble, idx) => ({
      suggestionIndex: idx,
      type: mapBubbleType(),
      bbox: {
        x: Math.round(bubble.bbox.x),
        y: Math.round(bubble.bbox.y),
        width: Math.round(bubble.bbox.width),
        height: Math.round(bubble.bbox.height),
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
      error: String((error as Error).message ?? "AI segmentation failed"),
    })
    throw new AppError("AI segmentation failed", 502)
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

