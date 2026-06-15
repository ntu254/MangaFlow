import type { NextFunction, Request, Response } from "express"
import {
  activateAdminUserService,
  createAdminUserService,
  deleteAdminUserService,
  listAdminUsersService,
  suspendAdminUserService,
  updateAdminUserRoleService,
  updateAdminUserService,
  addAdminBoardMemberService,
  activateAdminBoardMemberService,
  deactivateAdminBoardMemberService,
  listAdminBoardMembersService,
  setAdminBoardChairService,
  activateAdminTaskTypeService,
  createAdminTaskTypeService,
  deactivateAdminTaskTypeService,
  deleteAdminTaskTypeService,
  listAdminTaskTypesService,
  updateAdminTaskTypeService,
} from "./admin.service.js"
import type { UserRole } from "../auth/auth.types.js"

export async function listAdminUsers(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const users = await listAdminUsersService()
    res.json({ success: true, message: "Admin users retrieved", data: users.map(toAdminUserResponse) })
  } catch (err) {
    next(err)
  }
}

export async function createAdminUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await createAdminUserService(req.body as {
      email: string
      password: string
      name: string
      displayName?: string
      team?: string
      notes?: string
      role: UserRole
      isActive?: boolean
    })
    res.status(201).json({ success: true, message: "User created successfully", data: toAdminUserResponse(user) })
  } catch (err) {
    next(err)
  }
}

export async function updateAdminUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await updateAdminUserRoleService(String(req.params.userId), (req.body as { role: UserRole }).role)
    res.json({ success: true, message: "User role updated", data: user })
  } catch (err) {
    next(err)
  }
}

export async function updateAdminUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await updateAdminUserService(req.user!.userId, String(req.params.userId), req.body as {
      email?: string
      name?: string
      displayName?: string
      team?: string
      notes?: string
      role?: UserRole
      isActive?: boolean
    })
    res.json({ success: true, message: "User updated", data: toAdminUserResponse(user) })
  } catch (err) {
    next(err)
  }
}

export async function updateAdminUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const isActive = (req.body as { isActive: boolean }).isActive
    const user = isActive
      ? await activateAdminUserService(String(req.params.userId))
      : await suspendAdminUserService(req.user!.userId, String(req.params.userId))
    res.json({ success: true, message: isActive ? "User activated" : "User suspended", data: user })
  } catch (err) {
    next(err)
  }
}

export async function deleteAdminUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await deleteAdminUserService(req.user!.userId, String(req.params.userId))
    res.json({ success: true, message: "User deleted", data: toAdminUserResponse(user) })
  } catch (err) {
    next(err)
  }
}

function toAdminUserResponse(user: any) {
  return {
    id: String(user._id ?? user.id),
    email: user.email,
    name: user.name,
    displayName: user.displayName,
    team: user.team,
    notes: user.notes,
    role: user.role,
    isActive: Boolean(user.isActive),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}


export async function listAdminBoardMembers(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const members = await listAdminBoardMembersService()
    res.json({ success: true, message: "Admin board members retrieved", data: members.map(toAdminBoardMemberResponse) })
  } catch (err) {
    next(err)
  }
}

export async function createAdminBoardMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const member = await addAdminBoardMemberService((req.body as { userId: string }).userId)
    res.status(201).json({ success: true, message: "Board member added", data: toAdminBoardMemberResponse(member) })
  } catch (err) {
    next(err)
  }
}

export async function updateAdminBoardMemberStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const isActive = (req.body as { isActive: boolean }).isActive
    const member = isActive
      ? await activateAdminBoardMemberService(String(req.params.userId))
      : await deactivateAdminBoardMemberService(String(req.params.userId))
    res.json({ success: true, message: isActive ? "Board member activated" : "Board member deactivated", data: toAdminBoardMemberResponse(member) })
  } catch (err) {
    next(err)
  }
}

export async function updateAdminBoardChair(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const member = await setAdminBoardChairService(String(req.params.userId))
    res.json({ success: true, message: "Board Chair assigned", data: toAdminBoardMemberResponse(member) })
  } catch (err) {
    next(err)
  }
}

function toAdminBoardMemberResponse(member: any) {
  const user = member.userId ?? {}
  return {
    userId: String(user._id ?? user.id ?? member.userId),
    email: user.email,
    name: user.name,
    role: user.role,
    isUserActive: Boolean(user.isActive),
    isActive: Boolean(member.isActive),
    isChair: Boolean(member.isChair),
    createdAt: member.createdAt,
    updatedAt: member.updatedAt,
  }
}

export async function listAdminTaskTypes(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const taskTypes = await listAdminTaskTypesService()
    res.json({ success: true, message: "Admin task types retrieved", data: taskTypes.map(toAdminTaskTypeResponse) })
  } catch (err) {
    next(err)
  }
}

export async function createAdminTaskType(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const taskType = await createAdminTaskTypeService(req.body as { name: string; description: string; baseRate: number })
    res.status(201).json({ success: true, message: "Task type created", data: toAdminTaskTypeResponse(taskType) })
  } catch (err) {
    next(err)
  }
}

export async function updateAdminTaskType(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const taskType = await updateAdminTaskTypeService(String(req.params.taskTypeId), req.body as { name?: string; description?: string; baseRate?: number })
    res.json({ success: true, message: "Task type updated", data: toAdminTaskTypeResponse(taskType) })
  } catch (err) {
    next(err)
  }
}

export async function updateAdminTaskTypeStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const isActive = (req.body as { isActive: boolean }).isActive
    const taskType = isActive
      ? await activateAdminTaskTypeService(String(req.params.taskTypeId))
      : await deactivateAdminTaskTypeService(String(req.params.taskTypeId))
    res.json({ success: true, message: isActive ? "Task type activated" : "Task type deactivated", data: toAdminTaskTypeResponse(taskType) })
  } catch (err) {
    next(err)
  }
}

export async function deleteAdminTaskType(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const taskType = await deleteAdminTaskTypeService(String(req.params.taskTypeId))
    res.json({ success: true, message: "Task type deleted", data: taskType ? toAdminTaskTypeResponse(taskType) : null })
  } catch (err) {
    next(err)
  }
}

function toAdminTaskTypeResponse(taskType: any) {
  return {
    id: String(taskType._id ?? taskType.id),
    name: taskType.name,
    description: taskType.description,
    baseRate: Number(taskType.baseRate),
    isActive: Boolean(taskType.isActive),
    createdAt: taskType.createdAt,
    updatedAt: taskType.updatedAt,
  }
}
