export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api";

// In-memory access token storage
let memoryToken: string | null = null;
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

export function setAuthToken(token: string | null) {
  memoryToken = token;
}

export function getStoredToken() {
  return memoryToken;
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshRes = await originalFetch(`${apiBaseUrl}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

  if (!refreshRes.ok) {
    return null;
  }

  const data = await refreshRes.json().catch(() => null);
  const token = data?.success && data.data?.token ? data.data.token : null;
  if (token) {
    setAuthToken(token);
  }
  return token;
}

// Intercept window.fetch globally
const originalFetch = window.fetch;

window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  // Always include credentials to send cookies (like RefreshToken)
  const modifiedInit: RequestInit = {
    ...init,
    credentials: "include",
  };

  // Automatically attach Bearer token if we have one in memory
  if (memoryToken) {
    const headers = new Headers(modifiedInit.headers || {});
    if (!headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${memoryToken}`);
    }
    modifiedInit.headers = headers;
  }

  const url = typeof input === "string" ? input : (input as Request).url || input.toString();

  try {
    const response = await originalFetch(input, modifiedInit);

    // If 401 and not a login/logout endpoint, try to restore the access token
    // from the refresh cookie. Do not hard-navigate here; callers decide UI flow.
    const isRefreshable401 =
      response.status === 401 &&
      !url.includes("/auth/refresh") &&
      !url.includes("/auth/logout") &&
      !url.includes("/auth/login") &&
      !url.includes("/auth/me");

    if (isRefreshable401) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const token = await refreshAccessToken();
          if (token) {
            onRefreshed(token);
            // Retry the original request
            const retryHeaders = new Headers(modifiedInit.headers || {});
            retryHeaders.set("Authorization", `Bearer ${token}`);
            return originalFetch(input, { ...modifiedInit, headers: retryHeaders });
          }
          // Refresh failed
          setAuthToken(null);
          onRefreshed(""); // empty string means failure
          return response;
        } catch (err) {
          setAuthToken(null);
          onRefreshed("");
          return response;
        } finally {
          isRefreshing = false;
        }
      } else {
        // Wait for the ongoing refresh to complete
        return new Promise<Response>((resolve) => {
          addRefreshSubscriber((newToken) => {
            if (newToken) {
              const retryHeaders = new Headers(modifiedInit.headers || {});
              retryHeaders.set("Authorization", `Bearer ${newToken}`);
              resolve(originalFetch(input, { ...modifiedInit, headers: retryHeaders }));
            } else {
              resolve(response);
            }
          });
        });
      }
    }

    return response;
  } catch (error) {
    throw error;
  }
};

export type GetTokenFn = (options?: { template?: string; skipCache?: boolean }) => Promise<string | null>;

export async function getAuthToken(_getToken?: GetTokenFn): Promise<string> {
  if (!memoryToken) {
    throw new Error("Not authenticated");
  }
  return memoryToken;
}

export async function parseApiResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.message || fallbackMessage);
  }
  return json.data;
}

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  systemRole: string | null;
  status: string;
};

export async function fetchCurrentUser(token?: string): Promise<CurrentUser | null> {
  const response = await window.fetch(`${apiBaseUrl}/auth/me`, token ? {
    headers: { Authorization: `Bearer ${token}` }
  } : undefined);
  const json = await response.json().catch(() => ({ success: false }));
  if (json && json.success && json.data) {
    return json.data.user;
  }
  return null;
}
