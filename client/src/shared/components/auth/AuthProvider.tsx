import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { getCurrentUser, logoutUser } from "@/shared/api/client"
import type { AuthUser, AuthState } from "@/shared/api/auth.types"

interface AuthContextValue extends AuthState {
  login: (user: AuthUser) => void
  logout: () => Promise<void>
  setUser: (user: AuthUser) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  })

  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    if (!token) {
      setState({ user: null, isLoading: false, isAuthenticated: false })
      return
    }

    getCurrentUser()
      .then((res) => {
        if (res.success && res.data) {
          setState({ user: res.data as AuthUser, isLoading: false, isAuthenticated: true })
        } else {
          localStorage.removeItem("accessToken")
          localStorage.removeItem("refreshToken")
          setState({ user: null, isLoading: false, isAuthenticated: false })
        }
      })
      .catch(() => {
        setState({ user: null, isLoading: false, isAuthenticated: false })
      })
  }, [])

  const login = (user: AuthUser) => {
    setState({ user, isLoading: false, isAuthenticated: true })
  }

  const logout = async () => {
    await logoutUser()
    setState({ user: null, isLoading: false, isAuthenticated: false })
  }

  const setUser = (user: AuthUser) => {
    setState({ user, isLoading: false, isAuthenticated: true })
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
