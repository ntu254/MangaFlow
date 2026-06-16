import { useAuthStore } from "@/features/auth/store/authStore"
import { authApi } from "@/features/auth/services/auth.api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import type { UserRole } from "@/shared/types"

const ROLE_REDIRECT: Record<UserRole, string> = {
  ADMIN: "/app/admin/dashboard",
  MANGAKA: "/app/mangaka/dashboard",
  ASSISTANT: "/app/assistant/dashboard",
  EDITOR: "/app/editor/dashboard",
  BOARD: "/app/board/dashboard",
}

export function useAuth() {
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: ({ data }) => {
      const { user, accessToken, refreshToken } = data.data
      setAuth(user, accessToken, refreshToken)
      navigate(ROLE_REDIRECT[user.role])
    },
  })

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      clearAuth()
      queryClient.clear()
      navigate("/login")
    },
  })

  return {
    user,
    isAuthenticated,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
  }
}

export function useMe() {
  const { isAuthenticated } = useAuthStore()
  return useQuery({
    queryKey: ["me"],
    queryFn: () => authApi.me().then((r) => r.data.data),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  })
}