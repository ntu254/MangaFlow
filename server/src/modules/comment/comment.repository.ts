import type { CommentStatus, CommentVisibility } from "../../shared/workflow/status.js"
import { Chapter, Page, Region } from "../chapter/chapter.model.js"
import { Submission } from "../submission/submission.model.js"
import { Task } from "../task/task.model.js"
import { Comment } from "./comment.model.js"

export interface CreateCommentRecordInput {
  seriesId: string
  chapterId?: string
  pageId?: string
  regionId?: string
  taskId?: string
  submissionId?: string
  authorId: string
  body: string
  isBlocking?: boolean
  visibility?: CommentVisibility
}

export async function getTaskForComment(taskId: string) {
  return Task.findById(taskId)
}

export async function getSubmissionForComment(submissionId: string) {
  return Submission.findById(submissionId)
}

export async function getChapterForComment(chapterId: string) {
  return Chapter.findById(chapterId)
}

export async function getPageForComment(pageId: string) {
  return Page.findById(pageId)
}

export async function getRegionForComment(regionId: string) {
  return Region.findById(regionId)
}

export async function createCommentRecord(input: CreateCommentRecordInput) {
  return Comment.create({
    seriesId: input.seriesId,
    chapterId: input.chapterId,
    pageId: input.pageId,
    regionId: input.regionId,
    taskId: input.taskId,
    submissionId: input.submissionId,
    authorId: input.authorId,
    body: input.body,
    isBlocking: input.isBlocking ?? true,
    visibility: input.visibility ?? "PUBLIC_TO_ASSISTANT",
    status: "OPEN",
  })
}

export async function getCommentById(commentId: string) {
  return Comment.findById(commentId)
}

export async function listCommentsByTask(taskId: string, actorRole?: string) {
  const visibilityFilter: Record<string, unknown> = {}
  if (actorRole === "ASSISTANT") {
    // Assistants can only see comments intended for them
    visibilityFilter.visibility = "PUBLIC_TO_ASSISTANT"
  } else if (actorRole === "MANGAKA") {
    // Mangaka can see PUBLIC and MANGAKA_EDITOR_ONLY, but NOT EDITOR_INTERNAL
    visibilityFilter.visibility = { $in: ["PUBLIC_TO_ASSISTANT", "MANGAKA_EDITOR_ONLY"] }
  }
  // EDITOR and ADMIN see all comments (no filter)
  return Comment.find({ taskId, ...visibilityFilter })
    .sort({ createdAt: -1 })
    .populate("authorId", "name role")
    .lean()
}

export async function updateCommentStatus(
  commentId: string,
  status: CommentStatus,
  actorField: "fixedBy" | "verifiedBy" | "resolvedBy" | "reopenedBy",
  actorId: string,
) {
  const update: Record<string, unknown> = { status, [actorField]: actorId }
  if (status === "REOPENED") {
    update.fixedBy = undefined
    update.verifiedBy = undefined
    update.resolvedBy = undefined
  }
  return Comment.findByIdAndUpdate(commentId, update, { new: true })
}

export async function countBlockingUnresolvedComments(filter: { seriesId?: string; chapterId?: string; taskId?: string }) {
  const query: Record<string, unknown> = {
    isBlocking: true,
    status: { $ne: "RESOLVED" },
  }
  if (filter.seriesId) query.seriesId = filter.seriesId
  if (filter.chapterId) query.chapterId = filter.chapterId
  if (filter.taskId) query.taskId = filter.taskId
  return Comment.countDocuments(query)
}
