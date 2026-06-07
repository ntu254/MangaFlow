export type UserRole = "ADMIN" | "MANGAKA" | "ASSISTANT" | "EDITOR" | "BOARD" | "BOARD_CHAIR"

export interface JwtPayload {
  userId: string
  role: UserRole
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  isActive: boolean
}
