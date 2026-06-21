import { Page, Region } from "../../chapter/chapter.model.js"
import { Task } from "../task.model.js"

const ACTIVE_TASK_STATUSES = ["TODO", "IN_PROGRESS", "SUBMITTED", "REVISION_REQUESTED", "MANGAKA_APPROVED"]
const FINISHED_TASK_STATUSES = ["EDITOR_APPROVED", "REJECTED", "CANCELLED"]

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
  const [pageHasActiveTasks, pageHasApprovedTask, regionHasActiveTasks] = await Promise.all([
    Task.exists({ pageId, status: { $in: ACTIVE_TASK_STATUSES } }),
    Task.exists({ pageId, status: "EDITOR_APPROVED" }),
    regionId ? Task.exists({ regionId, status: { $in: ACTIVE_TASK_STATUSES } }) : Promise.resolve(null),
  ])

  // Determine page status:
  // - IN_TASK if any active task remains
  // - APPROVED if at least one task was EDITOR_APPROVED (all finished)
  // - UPLOADED if all tasks finished but none was EDITOR_APPROVED (all rejected/cancelled)
  const pageStatus = pageHasActiveTasks ? "IN_TASK" : pageHasApprovedTask ? "APPROVED" : "UPLOADED"

  await Promise.all([
    Page.findByIdAndUpdate(pageId, { status: pageStatus }),
    regionId && !regionHasActiveTasks
      ? Region.findByIdAndUpdate(regionId, { status: "ACTIVE" })
      : Promise.resolve(null),
  ])
}
