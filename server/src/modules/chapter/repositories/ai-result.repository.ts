import { AIResult } from "../chapter.model.js"

export async function createAIResultRepository(input: {
  pageId: string
  workingFileAssetId?: string
  requestedBy: string
  modelName?: string
  suggestions?: Array<{
    suggestionIndex: number
    type: string
    bbox: { x: number; y: number; width: number; height: number }
    confidence?: number
    decision?: "PENDING" | "ACCEPTED" | "REJECTED"
  }>
  status?: "PENDING" | "COMPLETED" | "FAILED" | "PARTIALLY_ACCEPTED"
  error?: string
}) {
  return AIResult.create({
    pageId: input.pageId,
    workingFileAssetId: input.workingFileAssetId,
    requestedBy: input.requestedBy,
    modelName: input.modelName,
    suggestions: (input.suggestions ?? []).map((item) => ({ ...item, decision: item.decision ?? "PENDING" })),
    status: input.status ?? "PENDING",
    error: input.error,
  })
}

export async function getAIResultsByPageRepository(pageId: string) {
  return AIResult.find({ pageId }).sort({ createdAt: -1 }).lean()
}

export async function getAIResultByIdRepository(aiResultId: string) {
  return AIResult.findById(aiResultId)
}

export async function updateAIResultRepository(aiResultId: string, patch: Record<string, unknown>) {
  return AIResult.findByIdAndUpdate(aiResultId, patch, { new: true })
}
