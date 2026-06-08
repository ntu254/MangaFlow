import { BoardMember } from "../board/board.model.js"
import { Series } from "../series/series.model.js"
import { Task, TaskType } from "../task/task.model.js"
import { User } from "../auth/auth.model.js"

export function countActiveUsers() {
  return User.countDocuments({ isActive: true })
}

export function countSeries() {
  return Series.countDocuments()
}

export function countActiveTasks() {
  return Task.countDocuments({ status: { $in: ["TODO", "IN_PROGRESS", "SUBMITTED", "REVISION_REQUESTED"] } })
}

export function countBoardMembers() {
  return BoardMember.countDocuments({ isActive: true })
}

export function countTaskTypes() {
  return TaskType.countDocuments({ isActive: true })
}
