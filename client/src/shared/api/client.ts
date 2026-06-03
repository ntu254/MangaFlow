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

    // If 401 and not an auth endpoint, try to refresh
    if (response.status === 401 && !url.includes("/auth/refresh") && !url.includes("/auth/logout")) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshRes = await originalFetch(`${apiBaseUrl}/auth/refresh`, {
            method: "POST",
            credentials: "include",
          });
          
          if (refreshRes.ok) {
            const data = await refreshRes.json();
            if (data.success && data.data?.token) {
              setAuthToken(data.data.token);
              onRefreshed(data.data.token);
              // Retry the original request
              const retryHeaders = new Headers(modifiedInit.headers || {});
              retryHeaders.set("Authorization", `Bearer ${data.data.token}`);
              return originalFetch(input, { ...modifiedInit, headers: retryHeaders });
            }
          }
          // Refresh failed
          setAuthToken(null);
          onRefreshed(""); // empty string means failure
          window.location.href = "/";
        } catch (err) {
          setAuthToken(null);
          onRefreshed("");
          window.location.href = "/";
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
  clerkId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  systemRole: string | null;
  status: string;
};

export async function fetchCurrentUser(): Promise<CurrentUser | null> {
  const response = await window.fetch(`${apiBaseUrl}/auth/me`);
  const json = await response.json().catch(() => ({ success: false }));
  if (json && json.success && json.data) {
    return json.data.user;
  }
  return null;
}
