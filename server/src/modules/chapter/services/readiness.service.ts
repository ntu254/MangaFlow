import { AppError } from "../../../shared/errors/AppError.js"
import { getChapterReadinessData } from "../chapter.repository.js"
import { Chapter } from "../chapter.model.js"

export interface PublicationReadinessItemResult {
  key: "allPagesUploaded" | "allTasksApproved" | "noPendingMangakaReview" | "noPendingEditorReview" | "allCommentsResolved"
  passed: boolean
  reason: string
}

export async function getChapterReadinessService(chapterId: string) {
  const trimmed = chapterId.trim()
  if (!trimmed) throw new AppError("Chapter id is required", 400)

  const readiness = await getChapterReadinessData(trimmed)
  if (!readiness) throw new AppError("Chapter not found", 404)

  const { chapter, pages, tasks, submissions, blockingComments } = readiness
  const hasPages = pages.length > 0
  const hasTasks = tasks.length > 0
  const hasPendingMangakaReview = submissions.some((submission) => submission.status === "SUBMITTED")
  const hasPendingEditorReview = submissions.some((submission) => submission.status === "MANGAKA_APPROVED")

  const items: PublicationReadinessItemResult[] = [
    { key: "allPagesUploaded", passed: hasPages && pages.every((page) => page.status === "UPLOADED" || page.status === "APPROVED"), reason: hasPages ? pages.every((page) => page.status === "UPLOADED" || page.status === "APPROVED") ? "All chapter pages exist and are uploaded." : "One or more pages are missing upload-ready status." : "No pages exist for this chapter." },
    { key: "allTasksApproved", passed: hasTasks && tasks.every((task) => task.status === "EDITOR_APPROVED"), reason: hasTasks ? tasks.every((task) => task.status === "EDITOR_APPROVED") ? "All tasks reached Editor approval." : "One or more tasks are not Editor-approved." : "No tasks exist for this chapter." },
    { key: "noPendingMangakaReview", passed: !hasPendingMangakaReview, reason: hasPendingMangakaReview ? "A submission is waiting for Mangaka review." : "No submissions are waiting for Mangaka review." },
    { key: "noPendingEditorReview", passed: !hasPendingEditorReview, reason: hasPendingEditorReview ? "A submission is waiting for Editor final review." : "No submissions are waiting for Editor final review." },
    { key: "allCommentsResolved", passed: blockingComments.length === 0, reason: blockingComments.length === 0 ? "All blocking comments are resolved by Editor." : `${blockingComments.length} blocking comment(s) still need Editor resolution.` },
  ]

  return {
    chapterId: String(chapter._id ?? chapter.id),
    chapterStatus: chapter.status,
    ready: items.every((item) => item.passed),
    items,
  }
}

export async function markChapterReadyService(chapterId: string) {
  const readiness = await getChapterReadinessService(chapterId)
  if (!readiness.ready) {
    throw new AppError("Chapter is not ready for publication. Please resolve all readiness blockers first.", 400)
  }

  const chapter = await Chapter.findByIdAndUpdate(
    readiness.chapterId,
    { status: "READY_FOR_PUBLICATION" },
    { new: true }
  )

  if (!chapter) throw new AppError("Chapter not found", 404)

  return chapter
}
