import { Page, Region } from "../../chapter/chapter.model.js"
import { Task } from "../task.model.js"

const ACTIVE_TASK_STATUSES = ["TODO", "IN_PROGRESS", "SUBMITTED", "REVISION_REQUESTED", "MANGAKA_APPROVED"]

export async function lockTaskTarget(task: { pageId?: unknown; regionId?: unknown }) {
  if (!task.pageId) return
  await Promise.all([
    Page.findByIdAndUpdate(String(task.pageId), { status: "IN_TASK" }),
    task.regionId ? Region.findByIdAndUpdate(String(task.regionId), { status: "LOCKED" }) : Promise.resolve(null),
  ])
}

export async function syncFinishedTaskTarget(task: { pageId?: unknown; regionId?: unknown }) {
  if (!task.pageId) return

  const pageId = String(task.pageId)
  const regionId = task.regionId ? String(task.regionId) : undefined
  const [pageHasActiveTasks, pageHasNonApprovedTasks, regionHasActiveTasks] = await Promise.all([
    Task.exists({ pageId, status: { $in: ACTIVE_TASK_STATUSES } }),
    Task.exists({ pageId, status: { $ne: "EDITOR_APPROVED" } }),
    regionId ? Task.exists({ regionId, status: { $in: ACTIVE_TASK_STATUSES } }) : Promise.resolve(null),
  ])

  await Promise.all([
    Page.findByIdAndUpdate(pageId, {
      status: pageHasActiveTasks ? "IN_TASK" : pageHasNonApprovedTasks ? "UPLOADED" : "APPROVED",
    }),
    regionId && !regionHasActiveTasks
      ? Region.findByIdAndUpdate(regionId, { status: "ACTIVE" })
      : Promise.resolve(null),
  ])
}
