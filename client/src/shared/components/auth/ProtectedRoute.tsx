import { Navigate, Outlet, useParams } from "react-router-dom"
import { useAuth } from "./AuthProvider"
import type { UserRole } from "@/shared/api/auth.types"

const ROLE_MAP: Record<string, string> = {
  admin: "ADMIN",
  mangaka: "MANGAKA",
  assistant: "ASSISTANT",
  editor: "EDITOR",
  board: "BOARD",
}

interface ProtectedRouteProps {
  roles?: UserRole[]
}

export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const { role } = useParams<{ role: string }>()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // If URL has a :role param, validate it matches the user's actual role
  if (role && user) {
    const expected = ROLE_MAP[role.toLowerCase()]
    if (!expected) {
      return <Navigate to={`/app/${user.role.toLowerCase()}/dashboard`} replace />
    }
    if (expected !== user.role) {
      return <Navigate to={`/app/${user.role.toLowerCase()}/dashboard`} replace />
    }
  }

  // If specific roles are required, check them
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to={`/app/${user.role.toLowerCase()}/dashboard`} replace />
  }

  return <Outlet />
}
