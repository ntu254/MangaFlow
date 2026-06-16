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

  // Flow-02/04: UPLOADED means all 3 assets exist and Page Studio is open.
  // PROCESSING_FAILED blocks Studio until the page is re-uploaded.
  if (page.status === "UPLOADING" || page.status === "PROCESSING_FAILED") {
    throw new AppError(`Page Studio unavailable: page status is ${page.status}`, 409)
  }
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
