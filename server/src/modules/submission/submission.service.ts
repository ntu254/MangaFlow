import { AppError } from "../../shared/errors/AppError.js"
import type { UserRole } from "../auth/auth.types.js"
import { SeriesMember } from "../series/series.model.js"
import {
  createSubmissionRecord,
  getSubmissionById,
  getTaskForSubmission,
  listSubmissionsByTask,
  updateSubmissionStatus,
  updateTaskStatusForSubmission,
} from "./submission.repository.js"

interface SubmissionActor {
  userId: string
  role: UserRole
}

interface SubmitTaskInput {
  taskId: string
  actor: SubmissionActor
  resultText?: string
  fileAssetId?: string
}

interface ReviewInput {
  submissionId: string
  actor: SubmissionActor
  reviewerNote?: string
}

async function assertSeriesMember(
  seriesId: string,
  actor: SubmissionActor,
  allowedRoles: Array<"MANGAKA" | "EDITOR" | "ASSISTANT">,
) {
  if (!allowedRoles.includes(actor.role as "MANGAKA" | "EDITOR" | "ASSISTANT")) {
    throw new AppError("Submission review access denied", 403)
  }

  const member = await SeriesMember.findOne({ seriesId, userId: actor.userId })
  if (!member || !member.isActive || !allowedRoles.includes(member.role)) {
    throw new AppError("Submission review access denied", 403)
  }
  return member
}

async function getSubmissionWithTask(submissionId: string) {
  const submission = await getSubmissionById(submissionId)
  if (!submission) {
    throw new AppError("Submission not found", 404)
  }

  const task = await getTaskForSubmission(String(submission.taskId))
  if (!task) {
    throw new AppError("Task not found", 404)
  }

  return { submission, task }
}

export async function createTaskSubmissionService(input: SubmitTaskInput) {
  const task = await getTaskForSubmission(input.taskId)
  if (!task) {
    throw new AppError("Task not found", 404)
  }

  if (String(task.assignedTo) !== input.actor.userId) {
    throw new AppError("Assistant can submit only their assigned task", 403)
  }

  await assertSeriesMember(String(task.seriesId), input.actor, ["ASSISTANT"])

  if (!["TODO", "IN_PROGRESS", "REVISION_REQUESTED"].includes(task.status)) {
    throw new AppError(`Task cannot be submitted from status ${task.status}`, 409)
  }

  if (!input.resultText?.trim() && !input.fileAssetId) {
    throw new AppError("Submission requires text result or file asset", 400)
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

  await updateTaskStatusForSubmission(input.taskId, "SUBMITTED")
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

  await assertSeriesMember(String(task.seriesId), actor, ["MANGAKA", "EDITOR"])
  return listSubmissionsByTask(taskId)
}

export async function mangakaApproveSubmissionService(input: ReviewInput) {
  const { submission, task } = await getSubmissionWithTask(input.submissionId)

  await assertSeriesMember(String(task.seriesId), input.actor, ["MANGAKA"])

  if (submission.status !== "SUBMITTED" || task.status !== "SUBMITTED") {
    throw new AppError("Mangaka approval requires submitted work", 409)
  }

  const updated = await updateSubmissionStatus(
    input.submissionId,
    "MANGAKA_APPROVED",
    input.reviewerNote,
  )
  await updateTaskStatusForSubmission(String(task._id), "MANGAKA_APPROVED")
  return updated
}

export async function editorApproveSubmissionService(input: ReviewInput) {
  const { submission, task } = await getSubmissionWithTask(input.submissionId)

  await assertSeriesMember(String(task.seriesId), input.actor, ["EDITOR"])

  if (submission.status !== "MANGAKA_APPROVED" || task.status !== "MANGAKA_APPROVED") {
    throw new AppError("Editor final approval requires Mangaka approval first", 409)
  }

  const updated = await updateSubmissionStatus(
    input.submissionId,
    "EDITOR_APPROVED",
    input.reviewerNote,
  )
  await updateTaskStatusForSubmission(String(task._id), "EDITOR_APPROVED")
  return updated
}

export async function requestSubmissionRevisionService(input: ReviewInput) {
  const { submission, task } = await getSubmissionWithTask(input.submissionId)

  if (submission.status === "SUBMITTED") {
    await assertSeriesMember(String(task.seriesId), input.actor, ["MANGAKA"])
  } else if (submission.status === "MANGAKA_APPROVED") {
    await assertSeriesMember(String(task.seriesId), input.actor, ["EDITOR"])
  } else {
    throw new AppError("Revision can be requested only during review", 409)
  }

  const updated = await updateSubmissionStatus(
    input.submissionId,
    "REVISION_REQUESTED",
    input.reviewerNote,
  )
  await updateTaskStatusForSubmission(String(task._id), "REVISION_REQUESTED")
  return updated
}

export async function rejectSubmissionService(input: ReviewInput) {
  const { submission, task } = await getSubmissionWithTask(input.submissionId)

  await assertSeriesMember(String(task.seriesId), input.actor, ["MANGAKA"])

  if (submission.status !== "SUBMITTED" || task.status !== "SUBMITTED") {
    throw new AppError("Rejection requires submitted work before Mangaka approval", 409)
  }

  const updated = await updateSubmissionStatus(
    input.submissionId,
    "REJECTED",
    input.reviewerNote,
  )
  await updateTaskStatusForSubmission(String(task._id), "REJECTED")
  return updated
}
