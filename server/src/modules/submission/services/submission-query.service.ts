import { AppError } from "../../../shared/errors/AppError.js"
import {
  createSubmissionRecord,
  getTaskForSubmission,
  listReviewQueueSubmissions,
  listSubmissionsByTask,
  updateTaskForNewSubmission,
} from "../submission.repository.js"
import type { SubmissionActor } from "../policies/submission-access.policy.js"
import { assertSubmissionSeriesMember } from "../policies/submission-access.policy.js"
import { assertSubmissionPayload, assertTaskSubmittable } from "../guards/submission-transition.guard.js"
import { checkObjectExists, createPresignedUploadUrl } from "../../chapter/file.service.js"
import { FileAsset } from "../../chapter/chapter.model.js"
import { config } from "../../../shared/utils/env.js"

export interface SubmitTaskInput {
  taskId: string
  actor: SubmissionActor
  resultText?: string
  fileAssetId?: string
}

async function assertSubmissionFileAsset(fileAssetId: string, actor: SubmissionActor) {
  const fileAsset = await FileAsset.findById(fileAssetId)
  if (!fileAsset) {
    throw new AppError("Submission file asset not found", 404)
  }
  if (fileAsset.status !== "ACTIVE") {
    throw new AppError("Submission file asset is not active", 400)
  }
  if (String(fileAsset.uploadedBy) !== actor.userId) {
    throw new AppError("Submission file asset belongs to another user", 403)
  }
  if (fileAsset.assetType !== "PRODUCTION") {
    throw new AppError("Submission requires a production file asset", 400)
  }
  if (!(await checkObjectExists(fileAsset.r2Key))) {
    throw new AppError("Submission file upload is not complete", 400)
  }
}

export async function createTaskSubmissionService(input: SubmitTaskInput) {
  const task = await getTaskForSubmission(input.taskId)
  if (!task) {
    throw new AppError("Task not found", 404)
  }

  if (String(task.assignedTo) !== input.actor.userId) {
    throw new AppError("Assistant can submit only their assigned task", 403)
  }

  await assertSubmissionSeriesMember(String(task.seriesId), input.actor, ["ASSISTANT"])
  assertTaskSubmittable(task.status)
  assertSubmissionPayload(input)

  if (input.fileAssetId) {
    await assertSubmissionFileAsset(input.fileAssetId, input.actor)
  }

  const submission = await createSubmissionRecord({
    taskId: input.taskId,
    submittedBy: input.actor.userId,
    resultText: input.resultText,
    fileAssetId: input.fileAssetId,
  })

  if (!submission) {
    throw new AppError("Task not found", 404)
  }

  await updateTaskForNewSubmission(input.taskId, String(submission._id))
  return submission
}

export async function listTaskSubmissionsService(taskId: string, actor: SubmissionActor) {
  const task = await getTaskForSubmission(taskId)
  if (!task) {
    throw new AppError("Task not found", 404)
  }

  if (String(task.assignedTo) === actor.userId) {
    return listSubmissionsByTask(taskId)
  }

  await assertSubmissionSeriesMember(String(task.seriesId), actor, ["MANGAKA", "EDITOR"])
  return listSubmissionsByTask(taskId)
}

export async function listReviewQueueSubmissionsService(actor: SubmissionActor, seriesIdFilter?: string) {
  if (actor.role === "ADMIN") {
    const { listReviewQueueSubmissionsAdmin } = await import("../submission.repository.js")
    return listReviewQueueSubmissionsAdmin(["SUBMITTED", "MANGAKA_APPROVED"], seriesIdFilter)
  }

  if (!["MANGAKA", "EDITOR"].includes(actor.role)) {
    throw new AppError("Review queue access denied", 403)
  }

  const role = actor.role as "MANGAKA" | "EDITOR"
  const { SeriesMember } = await import("../../series/series.model.js")
  const { ACTIVE_MEMBER_QUERY } = await import("../../../shared/policies/seriesMember.policy.js")
  const members = await SeriesMember.find({
    userId: actor.userId,
    role,
    ...ACTIVE_MEMBER_QUERY,
  }).lean()
  let seriesIds = members.map((member: any) => String(member.seriesId))
  if (seriesIdFilter) {
    seriesIds = seriesIds.filter(id => id === seriesIdFilter)
  }
  if (seriesIds.length === 0) {
    return []
  }

  const status = role === "MANGAKA" ? "SUBMITTED" : "MANGAKA_APPROVED"
  return listReviewQueueSubmissions(seriesIds, status)
}

export interface GetTaskUploadUrlInput {
  taskId: string
  actor: SubmissionActor
  originalName: string
  contentType: string
  size: number
}

export async function getTaskUploadUrlService(input: GetTaskUploadUrlInput) {
  const task = await getTaskForSubmission(input.taskId)
  if (!task) {
    throw new AppError("Task not found", 404)
  }

  if (String(task.assignedTo) !== input.actor.userId) {
    throw new AppError("Only assignee can upload task results", 403)
  }

  assertTaskSubmittable(task.status)

  const signed = await createPresignedUploadUrl(input.originalName, input.contentType)

  const fileAsset = await FileAsset.create({
    originalName: input.originalName,
    mimeType: input.contentType,
    size: input.size,
    r2Key: signed.r2Key,
    r2Bucket: config.r2Bucket,
    uploadedBy: input.actor.userId,
    assetType: "PRODUCTION",
  })

  return {
    uploadUrl: signed.uploadUrl,
    fileAssetId: fileAsset.id,
  }
}

