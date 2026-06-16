import { AppError } from "../../shared/errors/AppError.js"
import { Page, Region, AIResult } from "./chapter.model.js"
import { assertCanReadPage } from "../../shared/policies/accessPolicy.service.js"
import type { UserRole } from "../auth/auth.types.js"
import { Task } from "../task/task.model.js"

export async function getPageWorkspaceService(pageId: string, userId: string, role: UserRole) {
  const trimmed = pageId.trim()
  if (!trimmed) throw new AppError("Page id is required", 400)

  await assertCanReadPage({ userId, role }, trimmed)

  const page = await Page.findById(trimmed)
    .populate("originalFileAssetId")
    .populate("workingFileAssetId")
    .populate("thumbnailFileAssetId")
    .lean()

  if (!page) throw new AppError("Page not found", 404)
  if (!page.workingFileAssetId) throw new AppError("Page Studio unavailable because working image is missing", 409)

  const [regions, aiResults, tasks] = await Promise.all([
    Region.find({ pageId: trimmed }).sort({ regionIndex: 1 }).lean(),
    AIResult.find({ pageId: trimmed }).sort({ createdAt: -1 }).lean(),
    Task.find({ $or: [{ pageId: trimmed }, { contextPageIds: trimmed }] }).populate("taskTypeId").lean(),
  ])

  return {
    page,
    workingFileAsset: page.workingFileAssetId,
    originalFileAsset: page.originalFileAssetId,
    thumbnailFileAsset: page.thumbnailFileAssetId,
    regions,
    aiResults,
    tasks,
    feedbackPoints: [],
    collaborators: [],
  }
}
