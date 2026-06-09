import { AppError } from "../../../shared/errors/AppError.js"
import { hashPassword, revokeAllUserTokens, toAuthUser } from "../../auth/auth.service.js"
import type { UserRole } from "../../auth/auth.types.js"
import * as repository from "../admin.repository.js"

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
