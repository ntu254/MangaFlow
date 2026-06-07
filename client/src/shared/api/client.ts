const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api"

interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
}

function getTokens() {
  const accessToken = localStorage.getItem("accessToken")
  const refreshToken = localStorage.getItem("refreshToken")
  return { accessToken, refreshToken }
}

function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem("accessToken", accessToken)
  localStorage.setItem("refreshToken", refreshToken)
}

function clearTokens() {
  localStorage.removeItem("accessToken")
  localStorage.removeItem("refreshToken")
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const { accessToken } = getTokens()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  const json: ApiResponse<T> = await res.json()

  if (!res.ok && json.message === "Invalid or expired token" && path !== "/auth/refresh-token") {
    const { refreshToken } = getTokens()
    if (refreshToken) {
      const refreshRes = await fetch(`${BASE_URL}/auth/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      })
      const refreshJson = await refreshRes.json()
      if (refreshJson.success && refreshJson.data) {
        setTokens(refreshJson.data.accessToken, refreshJson.data.refreshToken)
        headers["Authorization"] = `Bearer ${refreshJson.data.accessToken}`
        const retryRes = await fetch(`${BASE_URL}${path}`, { ...options, headers })
        return retryRes.json()
      }
      clearTokens()
    }
  }

  return json
}

export async function loginUser(email: string, password: string) {
  const res = await apiRequest<{ user: unknown; accessToken: string; refreshToken: string }>(
    "/auth/login",
    { method: "POST", body: JSON.stringify({ email, password }) },
  )
  if (res.success && res.data) {
    setTokens(res.data.accessToken, res.data.refreshToken)
  }
  return res
}

export async function registerUser(name: string, email: string, password: string, role?: string) {
  const res = await apiRequest<{ user: unknown; accessToken: string; refreshToken: string }>(
    "/auth/register",
    { method: "POST", body: JSON.stringify({ name, email, password, role }) },
  )
  if (res.success && res.data) {
    setTokens(res.data.accessToken, res.data.refreshToken)
  }
  return res
}

export async function logoutUser() {
  const { refreshToken } = getTokens()
  await apiRequest("/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  })
  clearTokens()
}

export async function getCurrentUser() {
  return apiRequest<{ id: string; email: string; name: string; role: string; isActive: boolean }>(
    "/auth/me",
  )
}

export { clearTokens, getTokens, setTokens }
