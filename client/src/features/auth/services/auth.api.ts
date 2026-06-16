import { apiClient } from "@/shared/lib/axios"
import type { AuthResponse, ApiResponse, User } from "@/shared/types"

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<ApiResponse<AuthResponse>>("/auth/login", { email, password }),

  me: () =>
    apiClient.get<ApiResponse<User>>("/auth/me"),

  refresh: (refreshToken: string) =>
    apiClient.post<ApiResponse<{ accessToken: string }>>("/auth/refresh-token", { refreshToken }),

  logout: () =>
    apiClient.post("/auth/logout"),
}
