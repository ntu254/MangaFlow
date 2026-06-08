import { AppError } from "../../shared/errors/AppError.js"
import { hashPassword, revokeAllUserTokens, toAuthUser } from "../auth/auth.service.js"
import type { UserRole } from "../auth/auth.types.js"
import * as repository from "./admin.repository.js"

export interface AdminCreateUserInput {
  email: string
  password: string
  name: string
  role: UserRole
}

export async function listAdminUsersService() {
  return repository.listUsers()
}

export async function createAdminUserService(input: AdminCreateUserInput) {
  const existing = await repository.getUserByEmail(input.email)
  if (existing) throw new AppError("Email already registered", 409)

  const passwordHash = await hashPassword(input.password)
  const user = await repository.createUser({
    email: input.email.toLowerCase(),
    passwordHash,
    name: input.name,
    role: input.role,
  })

  return toAuthUser(user.id)
}

export async function updateAdminUserRoleService(userId: string, role: UserRole) {
  const user = await repository.updateUser(userId, { role })
  if (!user) throw new AppError("User not found", 404)

  if (role !== "BOARD") {
    const member = await repository.getBoardMemberByUser(userId)
    if (member) await repository.updateBoardMember(userId, { isActive: false, isChair: false })
  }

  await revokeAllUserTokens(userId)
  return toAuthUser(user.id)
}

export async function suspendAdminUserService(actorId: string, userId: string) {
  if (actorId === userId) throw new AppError("Admin cannot suspend their own account", 409)
  const user = await repository.updateUser(userId, { isActive: false })
  if (!user) throw new AppError("User not found", 404)
  await revokeAllUserTokens(userId)
  return toAuthUser(user.id)
}

export async function activateAdminUserService(userId: string) {
  const user = await repository.updateUser(userId, { isActive: true })
  if (!user) throw new AppError("User not found", 404)
  return toAuthUser(user.id)
}

export async function listAdminBoardMembersService() {
  return repository.listBoardMembers()
}

export async function addAdminBoardMemberService(userId: string) {
  const user = await repository.getUserById(userId)
  if (!user) throw new AppError("User not found", 404)
  if (!user.isActive) throw new AppError("Only active users can be Board members", 403)
  if (user.role !== "BOARD") throw new AppError("Board member user must have BOARD role", 403)
  return repository.upsertBoardMember(userId)
}

export async function activateAdminBoardMemberService(userId: string) {
  const member = await repository.updateBoardMember(userId, { isActive: true })
  if (!member) throw new AppError("Board member not found", 404)
  return member
}

export async function deactivateAdminBoardMemberService(userId: string) {
  const member = await repository.updateBoardMember(userId, { isActive: false, isChair: false })
  if (!member) throw new AppError("Board member not found", 404)
  return member
}

export async function setAdminBoardChairService(userId: string) {
  const user = await repository.getUserById(userId)
  if (!user) throw new AppError("User not found", 404)
  if (!user.isActive || user.role !== "BOARD") {
    throw new AppError("Board Chair must be an active BOARD user", 403)
  }

  await repository.clearBoardChairs(userId)
  return repository.upsertBoardMember(userId).then(async () => {
    const member = await repository.updateBoardMember(userId, { isActive: true, isChair: true })
    if (!member) throw new AppError("Board member not found", 404)
    return member
  })
}

export async function listAdminTaskTypesService() {
  return repository.listTaskTypes()
}

export async function createAdminTaskTypeService(input: { name: string; description: string; baseRate: number }) {
  const existing = await repository.getTaskTypeByName(input.name)
  if (existing) throw new AppError("Task type with this name already exists", 409)
  return repository.createTaskType(input)
}

export async function updateAdminTaskTypeService(taskTypeId: string, updates: { description?: string; baseRate?: number }) {
  const taskType = await repository.updateTaskType(taskTypeId, updates)
  if (!taskType) throw new AppError("Task type not found", 404)
  return taskType
}

export async function activateAdminTaskTypeService(taskTypeId: string) {
  const taskType = await repository.updateTaskType(taskTypeId, { isActive: true })
  if (!taskType) throw new AppError("Task type not found", 404)
  return taskType
}

export async function deactivateAdminTaskTypeService(taskTypeId: string) {
  const taskType = await repository.updateTaskType(taskTypeId, { isActive: false })
  if (!taskType) throw new AppError("Task type not found", 404)
  return taskType
}

export async function deleteAdminTaskTypeService(taskTypeId: string) {
  const taskType = await repository.getTaskType(taskTypeId)
  if (!taskType) throw new AppError("Task type not found", 404)
  if (await repository.taskTypeInUse(taskTypeId)) {
    await repository.updateTaskType(taskTypeId, { isActive: false })
    throw new AppError("Task type is in use and was deactivated instead", 409)
  }
  return repository.deleteTaskType(taskTypeId)
}

export async function getAdminDashboardService() {
  const [activeUsers, totalSeries, activeTasks, boardMembers, activeTaskTypes] = await Promise.all([
    repository.countActiveUsers(),
    repository.countSeries(),
    repository.countActiveTasks(),
    repository.countBoardMembers(),
    repository.countTaskTypes(),
  ])

  return {
    stats: { activeUsers, totalSeries, activeTasks, boardMembers, activeTaskTypes },
    systemHealth: [
      { key: "api", label: "API", status: "OPERATIONAL" },
      { key: "db", label: "Database", status: "OPERATIONAL" },
      { key: "storage", label: "Storage", status: "CONFIGURED" },
      { key: "ai", label: "AI Service", status: "PENDING_INTEGRATION" },
    ],
    storage: { usedLabel: "MVP monitor", usagePercent: 0 },
    auditPreview: [
      "Admin dashboard summary refreshed",
      "User, Board, and Task Type controls are backend-enforced",
      "Admin cannot override Board decisions",
    ],
  }
}
