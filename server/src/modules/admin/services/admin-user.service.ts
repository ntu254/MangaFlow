import { AppError } from "../../../shared/errors/AppError.js"
import { recordAuditLog } from "../../../shared/workflow/events.js"
import { hashPassword, revokeAllUserTokens, toAuthUser } from "../../auth/auth.service.js"
import type { UserRole } from "../../auth/auth.types.js"
import * as repository from "../admin.repository.js"

export interface AdminCreateUserInput {
  email: string
  password: string
  name: string
  displayName?: string
  team?: string
  notes?: string
  role: UserRole
  isActive?: boolean
}

export interface AdminUpdateUserInput {
  email?: string
  name?: string
  displayName?: string
  team?: string
  notes?: string
  role?: UserRole
  isActive?: boolean
}

export async function listAdminUsersService() {
  return repository.listUsers()
}

export async function createAdminUserService(input: AdminCreateUserInput, actorId?: string) {
  const existing = await repository.getUserByEmail(input.email)
  if (existing) throw new AppError("Email already registered", 409)

  const passwordHash = await hashPassword(input.password)
  const user = await repository.createUser({
    email: input.email.toLowerCase(),
    passwordHash,
    name: input.name,
    displayName: input.displayName,
    team: input.team,
    notes: input.notes,
    role: input.role,
    isActive: input.isActive,
  })

  await recordAdminAudit({
    event: "CONFIG_UPDATED",
    actorId,
    entityType: "User",
    entityId: toAuditId(user),
    metadata: {
      action: "USER_CREATED",
      role: user.role,
      isActive: user.isActive,
      changedFields: ["email", "name", "role", "isActive"],
    },
  })

  return user
}

export async function updateAdminUserRoleService(userId: string, role: UserRole, actorId?: string) {
  const existing = await repository.getUserById(userId)
  if (!existing) throw new AppError("User not found", 404)

  const user = await repository.updateUser(userId, { role })
  if (!user) throw new AppError("User not found", 404)

  if (role !== "BOARD") {
    const member = await repository.getBoardMemberByUser(userId)
    if (member) await repository.updateBoardMember(userId, { isActive: false, isChair: false })
  }

  await revokeAllUserTokens(userId)
  await recordAdminAudit({
    event: "USER_ROLE_UPDATED",
    actorId,
    entityType: "User",
    entityId: userId,
    metadata: {
      changedFields: ["role"],
      from: { role: existing.role },
      to: { role },
    },
  })
  return toAuthUser(user.id)
}

export async function updateAdminUserService(actorId: string, userId: string, input: AdminUpdateUserInput) {
  const existing = await repository.getUserById(userId)
  if (!existing) throw new AppError("User not found", 404)

  if (input.isActive === false && actorId === userId) {
    throw new AppError("Admin cannot suspend their own account", 409)
  }

  if (input.email && input.email.toLowerCase() !== existing.email) {
    const emailOwner = await repository.getUserByEmail(input.email)
    if (emailOwner && String(emailOwner.id) !== userId) throw new AppError("Email already registered", 409)
  }

  const updates = {
    ...(input.email !== undefined ? { email: input.email.toLowerCase() } : {}),
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
    ...(input.team !== undefined ? { team: input.team } : {}),
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
    ...(input.role !== undefined ? { role: input.role } : {}),
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
  }

  const user = await repository.updateUser(userId, updates)
  if (!user) throw new AppError("User not found", 404)

  if (input.role && input.role !== "BOARD") {
    const member = await repository.getBoardMemberByUser(userId)
    if (member) await repository.updateBoardMember(userId, { isActive: false, isChair: false })
  }

  if (input.role || input.email || input.isActive === false) {
    await revokeAllUserTokens(userId)
  }

  if (input.role !== undefined && input.role !== existing.role) {
    await recordAdminAudit({
      event: "USER_ROLE_UPDATED",
      actorId,
      entityType: "User",
      entityId: userId,
      metadata: {
        changedFields: ["role"],
        from: { role: existing.role },
        to: { role: input.role },
      },
    })
  }

  if (input.isActive !== undefined && input.isActive !== existing.isActive) {
    await recordAdminAudit({
      event: "USER_STATUS_UPDATED",
      actorId,
      entityType: "User",
      entityId: userId,
      metadata: {
        changedFields: ["isActive"],
        from: { isActive: existing.isActive },
        to: { isActive: input.isActive },
      },
    })
  }

  const profileChanges = changedFields(existing, updates, ["email", "name", "displayName", "team", "notes"])
  if (profileChanges.length > 0) {
    await recordAdminAudit({
      event: "CONFIG_UPDATED",
      actorId,
      entityType: "User",
      entityId: userId,
      metadata: {
        action: "USER_PROFILE_UPDATED",
        changedFields: profileChanges,
        from: pickFields(existing, profileChanges),
        to: pickFields(updates, profileChanges),
      },
    })
  }

  return user
}

export async function suspendAdminUserService(actorId: string, userId: string) {
  if (actorId === userId) throw new AppError("Admin cannot suspend their own account", 409)
  const existing = await repository.getUserById(userId)
  if (!existing) throw new AppError("User not found", 404)
  const user = await repository.updateUser(userId, { isActive: false })
  if (!user) throw new AppError("User not found", 404)
  await revokeAllUserTokens(userId)
  await recordAdminAudit({
    event: "USER_STATUS_UPDATED",
    actorId,
    entityType: "User",
    entityId: userId,
    metadata: {
      changedFields: ["isActive"],
      from: { isActive: existing.isActive },
      to: { isActive: false },
    },
  })
  return toAuthUser(user.id)
}

export async function activateAdminUserService(userId: string, actorId?: string) {
  const existing = await repository.getUserById(userId)
  if (!existing) throw new AppError("User not found", 404)
  const user = await repository.updateUser(userId, { isActive: true })
  if (!user) throw new AppError("User not found", 404)
  await recordAdminAudit({
    event: "USER_STATUS_UPDATED",
    actorId,
    entityType: "User",
    entityId: userId,
    metadata: {
      changedFields: ["isActive"],
      from: { isActive: existing.isActive },
      to: { isActive: true },
    },
  })
  return toAuthUser(user.id)
}

export async function deleteAdminUserService(actorId: string, userId: string) {
  if (actorId === userId) throw new AppError("Admin cannot delete their own account", 409)

  const user = await repository.deleteUser(userId)
  if (!user) throw new AppError("User not found", 404)

  const member = await repository.getBoardMemberByUser(userId)
  if (member) await repository.updateBoardMember(userId, { isActive: false, isChair: false })

  await revokeAllUserTokens(userId)
  await recordAdminAudit({
    event: "CONFIG_UPDATED",
    actorId,
    entityType: "User",
    entityId: userId,
    metadata: {
      action: "USER_DELETED",
      deletedRole: user.role,
      deletedEmail: user.email,
    },
  })
  return user
}

function toAuditId(document: any) {
  return String(document?._id ?? document?.id)
}

function changedFields(source: any, patch: Record<string, unknown>, fields: string[]) {
  return fields.filter((field) => field in patch && source[field] !== patch[field])
}

function pickFields(source: any, fields: string[]) {
  return Object.fromEntries(fields.map((field) => [field, source[field]]))
}

async function recordAdminAudit(input: {
  event: string
  actorId?: string
  entityType: string
  entityId: string
  metadata?: Record<string, unknown>
}) {
  try {
    await recordAuditLog(input)
  } catch {
    // Admin audit is best-effort in this MVP; business action should not fail on log write.
  }
}
