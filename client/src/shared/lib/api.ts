import axios from "axios";

// Keep API calls correct whether the environment value includes `/api` or not.
const configuredBaseUrl = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api"
).replace(/\/+$/, "");

export const API_BASE_URL = configuredBaseUrl.endsWith("/api")
  ? configuredBaseUrl
  : `${configuredBaseUrl}/api`;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Configure token interceptors for authentication
let accessToken: string | null =
  typeof window !== "undefined" ? localStorage.getItem("mangaflow.access_token") : null;
let refreshToken: string | null =
  typeof window !== "undefined" ? localStorage.getItem("mangaflow.refresh_token") : null;

export function setTokens(access: string | null, refresh: string | null) {
  accessToken = access;
  refreshToken = refresh;
  if (typeof window !== "undefined") {
    if (access) localStorage.setItem("mangaflow.access_token", access);
    else localStorage.removeItem("mangaflow.access_token");

    if (refresh) localStorage.setItem("mangaflow.refresh_token", refresh);
    else localStorage.removeItem("mangaflow.refresh_token");
  }
}

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken() {
  return refreshToken;
}

// Request Interceptor: Attach bearer token to request headers
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor: Handle token expiration and auto refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config ?? {};
    if (error.response?.status === 401 && !originalRequest._retry && refreshToken) {
      originalRequest._retry = true;
      try {
        const res = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken,
        });
        if (res.data?.success && res.data?.data) {
          const { accessToken: newAccess, refreshToken: newRefresh } = res.data.data;
          setTokens(newAccess, newRefresh);
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token failed, clear everything
        setTokens(null, null);
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    if (error.response?.status === 401 && !refreshToken && typeof window !== "undefined") {
      setTokens(null, null);
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);
