import { AppError } from "../../shared/errors/AppError.js"
import { Page, Region, AIResult, Chapter } from "./chapter.model.js"
import { assertCanReadPage } from "../../shared/policies/accessPolicy.service.js"
import type { UserRole } from "../auth/auth.types.js"
import { Task } from "../task/task.model.js"
import { SeriesMember } from "../series/series.model.js"

export async function getPageStudioService(pageId: string, userId: string, role: UserRole) {
  const trimmed = pageId.trim()
  if (!trimmed) throw new AppError("Page id is required", 400)

  await assertCanReadPage({ userId, role }, trimmed)

  const page = await Page.findById(trimmed)
    .populate("originalFileAssetId")
    .populate("workingFileAssetId")
    .populate("thumbnailFileAssetId")
    .lean()

  if (!page) throw new AppError("Page not found", 404)

  const chapter = await Chapter.findById(page.chapterId).select("_id seriesId").lean()
  if (!chapter) throw new AppError("Chapter not found for page studio", 404)

  const [regions, aiResults, tasks, assistants] = await Promise.all([
    Region.find({ pageId: trimmed }).sort({ regionIndex: 1 }).lean(),
    AIResult.find({ pageId: trimmed }).sort({ createdAt: -1 }).lean(),
    Task.find({ $or: [{ pageId: trimmed }, { contextPageIds: trimmed }] })
      .sort({ createdAt: -1 })
      .populate("taskTypeId")
      .populate("assignedTo", "name displayName email")
      .lean(),
    SeriesMember.find({
      seriesId: chapter.seriesId,
      role: "ASSISTANT",
      status: "ACTIVE",
      isActive: true,
    })
      .populate("userId", "name displayName email role")
      .lean(),
  ])

  return {
    page,
    chapter: {
      id: String(chapter._id),
      seriesId: String(chapter.seriesId),
    },
    workingFileAsset: page.workingFileAssetId,
    originalFileAsset: page.originalFileAssetId,
    thumbnailFileAsset: page.thumbnailFileAssetId,
    regions,
    aiResults,
    tasks,
    feedbackPoints: [],
    collaborators: assistants.map((member) => {
      const user = member.userId as unknown as { _id?: unknown; id?: unknown; name?: string; displayName?: string; email?: string; role?: string }
      const userId = user?._id ?? user?.id ?? member.userId
      return {
        id: String(userId),
        memberId: String(member._id),
        role: member.role,
        status: member.status,
        name: user?.displayName ?? user?.name ?? user?.email ?? "Assistant",
        email: user?.email,
      }
    }),
  }
}
