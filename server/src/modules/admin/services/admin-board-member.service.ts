import { AppError } from "../../../shared/errors/AppError.js"
import * as repository from "../admin.repository.js"

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
  await repository.upsertBoardMember(userId)
  const member = await repository.updateBoardMember(userId, { isActive: true, isChair: true })
  if (!member) throw new AppError("Board member not found", 404)
  return member
}
