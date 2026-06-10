import type { Request, Response } from "express"
import { User } from "./auth.model.js"
import {
  hashPassword,
  comparePassword,
  createTokenPair,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  toAuthUser,
} from "./auth.service.js"
import type { AuthUser } from "./auth.types.js"

const ROLE_DASHBOARD_MAP: Record<string, string> = {
  ADMIN: "/admin/dashboard",
  MANGAKA: "/mangaka/dashboard",
  ASSISTANT: "/assistant/dashboard",
  EDITOR: "/editor/dashboard",
  BOARD: "/board/dashboard",
}

export async function adminCreateUser(req: Request, res: Response): Promise<void> {
  const { email, password, name, role } = req.body as {
    email: string
    password: string
    name: string
    role: string
  }

  const existing = await User.findOne({ email: email.toLowerCase() })
  if (existing) {
    res.status(409).json({ success: false, message: "Email already registered" })
    return
  }

  const passwordHash = await hashPassword(password)
  const user = await User.create({ email, passwordHash, name, role })

  res.status(201).json({
    success: true,
    message: "User created successfully",
    data: await toAuthUser(user.id),
  })
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email: string; password: string }

  const user = await User.findOne({ email: email.toLowerCase() })
  if (!user) {
    res.status(401).json({ success: false, message: "Invalid email or password" })
    return
  }

  if (!user.isActive) {
    res.status(403).json({ success: false, message: "Account is suspended" })
    return
  }

  const valid = await comparePassword(password, user.passwordHash)
  if (!valid) {
    res.status(401).json({ success: false, message: "Invalid email or password" })
    return
  }

  const tokens = await createTokenPair(user.id, user.role)
  const authUser = await toAuthUser(user.id)

  res.json({
    success: true,
    message: "Login successful",
    data: {
      user: authUser,
      redirectTo: ROLE_DASHBOARD_MAP[user.role] ?? "/app/mangaka/dashboard",
      ...tokens,
    },
  })
}

export async function logout(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body as { refreshToken?: string }
  if (refreshToken) {
    await revokeRefreshToken(refreshToken)
  }

  if (req.user) {
    await revokeAllUserTokens(req.user.userId)
  }

  res.json({ success: true, message: "Logged out" })
}

export async function refreshToken(req: Request, res: Response): Promise<void> {
  const { refreshToken: token } = req.body as { refreshToken: string }

  const result = await rotateRefreshToken(token)
  if (!result) {
    res.status(401).json({ success: false, message: "Invalid or expired refresh token" })
    return
  }

  res.json({ success: true, data: result })
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Authentication required" })
    return
  }

  const user: AuthUser | null = await toAuthUser(req.user.userId)
  if (!user) {
    res.status(404).json({ success: false, message: "User not found" })
    return
  }

  res.json({ success: true, data: user })
}
