import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User } from "@/types"

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  clearAuth: () => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem("accessToken", accessToken)
        localStorage.setItem("refreshToken", refreshToken)
        set({ user, accessToken, refreshToken, isAuthenticated: true })
      },
      clearAuth: () => {
        localStorage.removeItem("accessToken")
        localStorage.removeItem("refreshToken")
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
      },
      updateUser: (partial) =>
        set((state) => ({ user: state.user ? { ...state.user, ...partial } : null })),
    }),
    { name: "mangaflow-auth", partialize: (s) => ({ user: s.user, accessToken: s.accessToken, refreshToken: s.refreshToken, isAuthenticated: s.isAuthenticated }) }
  )
)