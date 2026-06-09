import { User } from "../auth/auth.model.js"
import { BoardMember } from "../board/board.model.js"
import { Series } from "../series/series.model.js"
import { Task, TaskType } from "../task/task.model.js"

export function listUsers() {
  return User.find().sort({ createdAt: -1 }).lean()
}

export function getUserById(userId: string) {
  return User.findById(userId)
}

export function getUserByEmail(email: string) {
  return User.findOne({ email: email.toLowerCase() })
}

export function createUser(input: { email: string; passwordHash: string; name: string; role: string }) {
  return User.create(input)
}

export function updateUser(userId: string, updates: { role?: string; isActive?: boolean }) {
  return User.findByIdAndUpdate(userId, updates, { new: true })
}

export function listBoardMembers() {
  return BoardMember.find().sort({ isChair: -1, updatedAt: -1 }).populate("userId", "email name role isActive").lean()
}

export function getBoardMemberByUser(userId: string) {
  return BoardMember.findOne({ userId })
}

export function upsertBoardMember(userId: string) {
  return BoardMember.findOneAndUpdate(
    { userId },
    { userId, isActive: true },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).populate("userId", "email name role isActive")
}

export function updateBoardMember(userId: string, updates: { isActive?: boolean; isChair?: boolean }) {
  return BoardMember.findOneAndUpdate({ userId }, updates, { new: true }).populate("userId", "email name role isActive")
}

export function clearBoardChairs(exceptUserId?: string) {
  const query = exceptUserId ? { userId: { $ne: exceptUserId } } : {}
  return BoardMember.updateMany(query, { isChair: false })
}

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

export function listTaskTypes() {
  return TaskType.find().sort({ name: 1 }).lean()
}

export function getTaskType(taskTypeId: string) {
  return TaskType.findById(taskTypeId)
}

export function getTaskTypeByName(name: string) {
  return TaskType.findOne({ name })
}

export function createTaskType(input: { name: string; description: string; baseRate: number }) {
  return TaskType.create(input)
}

export function updateTaskType(taskTypeId: string, updates: { description?: string; baseRate?: number; isActive?: boolean }) {
  return TaskType.findByIdAndUpdate(taskTypeId, updates, { new: true })
}

export function taskTypeInUse(taskTypeId: string) {
  return Task.exists({ taskTypeId })
}

export function deleteTaskType(taskTypeId: string) {
  return TaskType.findByIdAndDelete(taskTypeId)
}
