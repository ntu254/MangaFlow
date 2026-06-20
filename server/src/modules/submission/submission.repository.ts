import type { SubmissionStatus } from "../../shared/workflow/status.js"
import { Task } from "../task/task.model.js"
import { Submission } from "./submission.model.js"

export interface CreateSubmissionInput {
  taskId: string
  submittedBy: string
  resultText?: string
  fileAssetId?: string
}

export async function getTaskForSubmission(taskId: string) {
  return Task.findById(taskId)
}

export async function getSubmissionById(submissionId: string) {
  return Submission.findById(submissionId)
}

export async function getLatestSubmissionForTask(taskId: string) {
  return Submission.findOne({ taskId }).sort({ version: -1 })
}

export async function createSubmissionRecord(input: CreateSubmissionInput) {
  const task = await Task.findById(input.taskId)
  if (!task) return null

  const latest = await getLatestSubmissionForTask(input.taskId)
  const version = latest ? latest.version + 1 : 1

  const submission = await Submission.create({
    taskId: task._id,
    seriesId: task.seriesId,
    chapterId: task.chapterId,
    pageId: task.pageId,
    regionId: task.regionId,
    submittedBy: input.submittedBy,
    version,
    resultText: input.resultText,
    fileAssetId: input.fileAssetId,
    status: "SUBMITTED",
  })

  return submission
}

export async function updateTaskForNewSubmission(taskId: string, submissionId: string) {
  return Task.findOneAndUpdate(
    {
      _id: taskId,
      status: { $in: ["TODO", "IN_PROGRESS", "REVISION_REQUESTED"] },
    },
    {
      status: "SUBMITTED",
      currentSubmissionId: submissionId,
    },
    { new: true },
  )
}

export async function updateSubmissionStatus(
  submissionId: string,
  status: SubmissionStatus,
  reviewerNote?: string,
) {
  return Submission.findByIdAndUpdate(
    submissionId,
    { status, reviewerNote },
    { new: true },
  )
}

export async function updateTaskStatusForSubmission(taskId: string, status: string) {
  return Task.findByIdAndUpdate(taskId, { status }, { new: true })
}

export async function updateTaskReviewState(
  taskId: string,
  patch: Record<string, unknown>,
) {
  return Task.findByIdAndUpdate(taskId, patch, { new: true })
}

export async function listSubmissionsByTask(taskId: string) {
  const docs = await Submission.find({ taskId })
    .sort({ version: -1 })
    .populate("submittedBy", "name role")
    .populate("fileAssetId", "originalName")
    .lean()
  return docs.map((d: any) => ({ ...d, id: String(d._id) }))
}

export async function listReviewQueueSubmissions(seriesIds: string[], status: SubmissionStatus) {
  const docs = await Submission.find({ seriesId: { $in: seriesIds }, status })
    .sort({ updatedAt: -1 })
    .populate("submittedBy", "name role")
    .populate("fileAssetId", "originalName")
    .lean()
  return docs.map((d: any) => ({ ...d, id: String(d._id) }))
}

export async function listReviewQueueSubmissionsAdmin(statuses: SubmissionStatus[], seriesIdFilter?: string) {
  const query: any = { status: { $in: statuses } }
  if (seriesIdFilter) {
    query.seriesId = seriesIdFilter
  }
  const docs = await Submission.find(query)
    .sort({ updatedAt: -1 })
    .populate("submittedBy", "name role")
    .populate("fileAssetId", "originalName")
    .lean()
  return docs.map((d: any) => ({ ...d, id: String(d._id) }))
}
