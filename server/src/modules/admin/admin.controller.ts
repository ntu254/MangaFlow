import type { NextFunction, Request, Response } from "express"
import {
  activateAdminUserService,
  createAdminUserService,
  listAdminUsersService,
  suspendAdminUserService,
  updateAdminUserRoleService,
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
    const user = await createAdminUserService(req.body as { email: string; password: string; name: string; role: UserRole })
    res.status(201).json({ success: true, message: "User created successfully", data: user })
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

function toAdminUserResponse(user: any) {
  return {
    id: String(user._id ?? user.id),
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: Boolean(user.isActive),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}
