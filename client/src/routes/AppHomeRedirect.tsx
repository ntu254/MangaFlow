import { Navigate } from "react-router-dom"
import { useAuth } from "@/shared/components/auth/AuthProvider"

export function AppHomeRedirect() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={`/app/${user.role.toLowerCase()}/dashboard`} replace />
}
