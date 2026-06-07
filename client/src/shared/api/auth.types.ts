export type UserRole = "ADMIN" | "MANGAKA" | "ASSISTANT" | "EDITOR" | "BOARD" | "BOARD_CHAIR"

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  isActive: boolean
}

export interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
}
