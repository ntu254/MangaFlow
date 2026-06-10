import { AppError } from "../errors/AppError.js"
import type { UserRole } from "../../modules/auth/auth.types.js"
import { Chapter, FileAsset, Page, Region } from "../../modules/chapter/chapter.model.js"
import { SeriesMember } from "../../modules/series/series.model.js"
import { Submission } from "../../modules/submission/submission.model.js"
import { Task } from "../../modules/task/task.model.js"

export interface AccessActor {
  userId: string
  role: UserRole
}

async function isActiveSeriesManager(seriesId: string, actor: AccessActor): Promise<boolean> {
  const member = await SeriesMember.findOne({ seriesId, userId: actor.userId })
  return Boolean(member?.isActive && ["MANGAKA", "EDITOR"].includes(member.role))
}

export async function canReadChapter(actor: AccessActor, chapterId: string): Promise<boolean> {
  const chapter = await Chapter.findById(chapterId)
  if (!chapter) throw new AppError("Chapter not found", 404)
  const seriesId = String(chapter.seriesId)

  if (actor.role === "ADMIN") return true
  return await isActiveSeriesManager(seriesId, actor)
}

export async function assertCanReadChapter(actor: AccessActor, chapterId: string): Promise<void> {
  if (!(await canReadChapter(actor, chapterId))) {
    throw new AppError("Chapter access denied", 403)
  }
}

export async function canReadPage(actor: AccessActor, pageId: string): Promise<boolean> {
  const page = await Page.findById(pageId)
  if (!page) throw new AppError("Page not found", 404)

  const chapter = await Chapter.findById(page.chapterId)
  if (!chapter) throw new AppError("Chapter not found", 404)
  const seriesId = String(chapter.seriesId)

  if (actor.role === "ADMIN") return true
  if (await isActiveSeriesManager(seriesId, actor)) return true

  if (actor.role !== "ASSISTANT") return false

  const assignedOrContextTask = await Task.findOne({
    seriesId,
    assignedTo: actor.userId,
    $or: [
      { pageId },
      { contextPageIds: pageId },
    ],
  })

  return Boolean(assignedOrContextTask)
}

export async function assertCanReadPage(actor: AccessActor, pageId: string): Promise<void> {
  if (!(await canReadPage(actor, pageId))) {
    throw new AppError("Page access denied", 403)
  }
}

export async function assertCanReadRegion(actor: AccessActor, regionId: string): Promise<void> {
  const region = await Region.findById(regionId)
  if (!region) throw new AppError("Region not found", 404)
  await assertCanReadPage(actor, String(region.pageId))
}

export async function canWritePage(actor: AccessActor, pageId: string): Promise<boolean> {
  const page = await Page.findById(pageId)
  if (!page) throw new AppError("Page not found", 404)

  const chapter = await Chapter.findById(page.chapterId)
  if (!chapter) throw new AppError("Chapter not found", 404)
  const seriesId = String(chapter.seriesId)

  if (actor.role === "ADMIN") return true
  return await isActiveSeriesManager(seriesId, actor)
}

export async function assertCanWritePage(actor: AccessActor, pageId: string): Promise<void> {
  if (!(await canWritePage(actor, pageId))) {
    throw new AppError("Page write access denied", 403)
  }
}

export async function canWriteChapter(actor: AccessActor, chapterId: string): Promise<boolean> {
  const chapter = await Chapter.findById(chapterId)
  if (!chapter) throw new AppError("Chapter not found", 404)
  const seriesId = String(chapter.seriesId)

  if (actor.role === "ADMIN") return true
  return await isActiveSeriesManager(seriesId, actor)
}

export async function assertCanWriteChapter(actor: AccessActor, chapterId: string): Promise<void> {
  if (!(await canWriteChapter(actor, chapterId))) {
    throw new AppError("Chapter write access denied", 403)
  }
}

export async function canWriteRegion(actor: AccessActor, regionId: string): Promise<boolean> {
  const region = await Region.findById(regionId)
  if (!region) throw new AppError("Region not found", 404)
  return canWritePage(actor, String(region.pageId))
}

export async function assertCanWriteRegion(actor: AccessActor, regionId: string): Promise<void> {
  if (!(await canWriteRegion(actor, regionId))) {
    throw new AppError("Region write access denied", 403)
  }
}

export async function assertCanReadFileAsset(actor: AccessActor, fileAssetId: string): Promise<void> {
  const fileAsset = await FileAsset.findById(fileAssetId)
  if (!fileAsset) throw new AppError("File asset not found", 404)

  if (String(fileAsset.uploadedBy) === actor.userId) return
  if (actor.role === "ADMIN") return

  const page = await Page.findOne({
    $or: [
      { originalFileAssetId: fileAssetId },
      { variantFileAssetIds: fileAssetId },
    ],
  })
  if (page) {
    await assertCanReadPage(actor, String(page._id))
    return
  }

  const submission = await Submission.findOne({ fileAssetId })
  if (submission) {
    if (String(submission.submittedBy) === actor.userId) return
    if (await isActiveSeriesManager(String(submission.seriesId), actor)) return

    if (actor.role === "ASSISTANT") {
      const task = await Task.findOne({ _id: submission.taskId, assignedTo: actor.userId })
      if (task) return
    }
  }

  throw new AppError("File access denied", 403)
}