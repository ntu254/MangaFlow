import axios from "axios"

const BASE_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:5000/api"

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
})

// Request interceptor - attach access token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor - handle 401 and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refreshToken = localStorage.getItem("refreshToken")
        const { data } = await axios.post(`${BASE_URL}/auth/refresh-token`, { refreshToken })
        localStorage.setItem("accessToken", data.data.accessToken)
        original.headers.Authorization = `Bearer ${data.data.accessToken}`
        return apiClient(original)
      } catch {
        localStorage.removeItem("accessToken")
        localStorage.removeItem("refreshToken")
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  }
)
