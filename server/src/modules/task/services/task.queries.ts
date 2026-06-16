import { AppError } from "../../../shared/errors/AppError.js"
import { listTasksByAssignee, listTasksByChapter, listTasksBySeries, getTaskById } from "../task.repository.js"
import { Chapter } from "../../chapter/chapter.model.js"
import { findActiveSeriesMember } from "../../../shared/policies/seriesMember.policy.js"
import { assertSeriesTaskAccess, type TaskActor } from "./task.access.js"

export async function getTaskService(taskId: string, actor: TaskActor) {
  const task = await getTaskById(taskId)
  if (!task) throw new AppError("Task not found", 404)
  await assertSeriesTaskAccess(String(task.seriesId), actor, task.assignedTo)
  return task
}

export async function listTasksBySeriesService(seriesId: string, actor: TaskActor, filters?: { status?: string; assignedTo?: string }) {
  const member = await findActiveSeriesMember(seriesId, actor.userId)
  if (!member) throw new AppError("Task access denied", 403)
  if (member.role === "ASSISTANT") return listTasksBySeries(seriesId, { ...filters, assignedTo: actor.userId })
  if (!["MANGAKA", "EDITOR"].includes(member.role)) throw new AppError("Task access denied", 403)
  return listTasksBySeries(seriesId, filters)
}

export async function listTasksByChapterService(chapterId: string, actor: TaskActor) {
  const chapter = await Chapter.findById(chapterId)
  if (!chapter) throw new AppError("Chapter not found", 404)
  const seriesId = String(chapter.seriesId)
  const member = await findActiveSeriesMember(seriesId, actor.userId)
  if (!member) throw new AppError("Task access denied", 403)
  if (member.role === "ASSISTANT") {
    return (await listTasksByChapter(chapterId)).filter((task) => String(task.assignedTo) === actor.userId)
  }
  if (!["MANGAKA", "EDITOR"].includes(member.role)) throw new AppError("Task access denied", 403)
  return listTasksByChapter(chapterId)
}

export async function listTasksByAssigneeService(assigneeId: string, actor: TaskActor) {
  if (assigneeId !== actor.userId && actor.role !== "ADMIN") throw new AppError("Task access denied", 403)
  return listTasksByAssignee(assigneeId)
}
