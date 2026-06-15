import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import type { SignOptions } from "jsonwebtoken"
import { User, RefreshToken } from "./auth.model.js"
import { config } from "../../shared/utils/env.js"
import type { JwtPayload, TokenPair, AuthUser, UserRole } from "./auth.types.js"

const SALT_ROUNDS = 12

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: "15m" } as SignOptions)
}

function generateRefreshToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
}

export async function createTokenPair(userId: string, role: UserRole): Promise<TokenPair> {
  const accessToken = generateAccessToken({ userId, role })
  const refreshToken = generateRefreshToken()

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  await RefreshToken.create({ userId, token: refreshToken, expiresAt })

  return { accessToken, refreshToken }
}

export async function verifyAccessToken(token: string): Promise<JwtPayload> {
  return jwt.verify(token, config.jwtSecret) as JwtPayload
}

export async function rotateRefreshToken(oldToken: string): Promise<TokenPair | null> {
  const doc = await RefreshToken.findOne({ token: oldToken })
  if (!doc || doc.expiresAt < new Date()) {
    if (doc) await RefreshToken.deleteOne({ _id: doc._id })
    return null
  }

  await RefreshToken.deleteOne({ _id: doc._id })

  const user = await User.findById(doc.userId)
  if (!user || !user.isActive) return null

  return createTokenPair(user.id, user.role)
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await RefreshToken.deleteOne({ token })
}

export async function revokeAllUserTokens(userId: string): Promise<void> {
  await RefreshToken.deleteMany({ userId })
}

export async function toAuthUser(userId: string): Promise<AuthUser | null> {
  const user = await User.findById(userId)
  if (!user || !user.isActive) return null
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
  }
}
