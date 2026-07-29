export type ApiRole = "ADMIN" | "MANGAKA" | "ASSISTANT" | "EDITOR" | "BOARD";
export type WebRole = "admin" | "mangaka" | "assistant" | "editor" | "board";

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  role: ApiRole;
  isChair?: boolean;
};

export type WebUser = Omit<ApiUser, "role"> & { role: WebRole };

export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message?: string;
  code?: string;
  requestId?: string;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
  };
};

export type ApiTokens = {
  accessToken: string;
  refreshToken: string;
};

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
  headers?: HeadersInit;
};

const TOKEN_KEY = "beachread-api-tokens";

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly requestId?: string;

  constructor({
    status,
    message,
    code,
    requestId,
  }: {
    status: number;
    message: string;
    code?: string;
    requestId?: string;
  }) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

export const API_ROLE_TO_WEB: Record<ApiRole, WebRole> = {
  ADMIN: "admin",
  MANGAKA: "mangaka",
  ASSISTANT: "assistant",
  EDITOR: "editor",
  BOARD: "board",
};

export const WEB_ROLE_TO_API: Record<WebRole, ApiRole> = {
  admin: "ADMIN",
  mangaka: "MANGAKA",
  assistant: "ASSISTANT",
  editor: "EDITOR",
  board: "BOARD",
};

export function apiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api";
}

export function mapApiUser(user: ApiUser): WebUser {
  return {
    ...user,
    role: API_ROLE_TO_WEB[user.role],
  };
}

export function getApiTokens(): ApiTokens | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ApiTokens>;
    if (parsed.accessToken && parsed.refreshToken) return parsed as ApiTokens;
  } catch {
    clearApiTokens();
  }
  return null;
}

export function hasApiTokens() {
  return getApiTokens() !== null;
}

export function isUnauthorizedApiError(error: unknown) {
  return error instanceof ApiRequestError && (error.status === 401 || error.status === 403);
}

export function setApiTokens(tokens: ApiTokens) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
}

export function clearApiTokens() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
}

let _onUnauthorized: (() => void) | null = null;
export function registerUnauthorizedHandler(fn: () => void) {
  _onUnauthorized = fn;
}

// --- Refresh dedup guard ---
let _refreshPromise: Promise<boolean> | null = null;

async function doRefreshTokens(refreshToken: string): Promise<boolean> {
  try {
    const data = await apiRequest<{ accessToken: string; refreshToken: string }>("/auth/refresh", {
      method: "POST",
      auth: false,
      body: { refreshToken },
    });
    setApiTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    return true;
  } catch {
    clearApiTokens();
    if (_onUnauthorized) _onUnauthorized();
    return false;
  }
}

function refreshTokens(refreshToken: string): Promise<boolean> {
  if (!_refreshPromise) {
    _refreshPromise = doRefreshTokens(refreshToken).finally(() => {
      _refreshPromise = null;
    });
  }
  return _refreshPromise;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const tokens = getApiTokens();
  const headers: HeadersInit = {
    Accept: "application/json",
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(options.auth !== false && tokens?.accessToken
      ? { Authorization: `Bearer ${tokens.accessToken}` }
      : {}),
    ...(options.headers ?? {}),
  };

  const response = await fetch(`${apiBaseUrl()}${path}`, {
    method: options.method ?? "GET",
    headers,
    body:
      options.body instanceof FormData
        ? options.body
        : options.body === undefined
          ? undefined
          : JSON.stringify(options.body),
  });

  // Handle 401: attempt refresh exactly once, then give up
  if (response.status === 401 && options.auth !== false && path !== "/auth/refresh") {
    if (tokens?.refreshToken) {
      const refreshed = await refreshTokens(tokens.refreshToken);
      if (refreshed) {
        // Retry original request once with new tokens
        const newTokens = getApiTokens();
        const retryHeaders: HeadersInit = {
          Accept: "application/json",
          ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
          ...(newTokens?.accessToken ? { Authorization: `Bearer ${newTokens.accessToken}` } : {}),
          ...(options.headers ?? {}),
        };
        const retryResponse = await fetch(`${apiBaseUrl()}${path}`, {
          method: options.method ?? "GET",
          headers: retryHeaders,
          body:
            options.body instanceof FormData
              ? options.body
              : options.body === undefined
                ? undefined
                : JSON.stringify(options.body),
        });
        const retryEnvelope = (await retryResponse
          .json()
          .catch(() => null)) as ApiEnvelope<T> | null;
        if (!retryResponse.ok || !retryEnvelope?.success) {
          throw new ApiRequestError({
            status: retryResponse.status,
            message: retryEnvelope?.message ?? `API request failed with ${retryResponse.status}`,
            code: retryEnvelope?.code,
            requestId: retryEnvelope?.requestId,
          });
        }
        return retryEnvelope.data;
      }
      // Refresh failed — tokens cleared inside doRefreshTokens
      throw new ApiRequestError({
        status: 401,
        message: "Session expired. Please log in again.",
      });
    }
    // No refresh token — force logout
    if (_onUnauthorized) _onUnauthorized();
    throw new ApiRequestError({
      status: 401,
      message: "Unauthorized",
    });
  }

  const envelope = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!response.ok || !envelope?.success) {
    throw new ApiRequestError({
      status: response.status,
      message: envelope?.message ?? `API request failed with ${response.status}`,
      code: envelope?.code,
      requestId: envelope?.requestId,
    });
  }

  return envelope.data;
}
