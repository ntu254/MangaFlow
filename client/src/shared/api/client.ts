export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api";

export type GetTokenFn = (options?: { template?: string; skipCache?: boolean }) => Promise<string | null>;

export async function getAuthToken(getToken: GetTokenFn): Promise<string> {
  const token = await getToken({ template: "mangaflow" });
  if (!token) {
    throw new Error("Not authenticated");
  }
  return token;
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

export async function fetchCurrentUser(token: string): Promise<CurrentUser | null> {
  const response = await fetch(`${apiBaseUrl}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const json = await response.json().catch(() => ({ success: false }));
  if (json && json.success && json.data) {
    return json.data.user;
  }
  return null;
}
