import { BoardMember } from "../board/board.model.js"
import { Series } from "../series/series.model.js"
import { Task, TaskType } from "../task/task.model.js"
import { User } from "../auth/auth.model.js"
import { AssistantEarning } from "../payroll/payroll.model.js"

export function countActiveUsers() {
  return User.countDocuments({ isActive: true })
}

export function countSeries(query: any = {}) {
  return Series.countDocuments(query)
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


export function countSuspendedUsers() {
  return User.countDocuments({ isActive: false })
}

export function countSeriesPendingReview() {
  return Series.countDocuments({ status: { $in: ["EDITOR_REVIEW", "BOARD_REVIEW"] } })
}

export function countActiveBoardChairs() {
  return BoardMember.countDocuments({ isActive: true, isChair: true })
}

export function countInactiveTaskTypes() {
  return TaskType.countDocuments({ isActive: false })
}

export function countPendingPayrollConfirmations() {
  return AssistantEarning.countDocuments({ status: "PENDING" })
}
