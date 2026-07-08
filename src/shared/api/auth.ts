import {
  apiRequest,
  clearApiTokens,
  mapApiUser,
  setApiTokens,
  type ApiUser,
  type WebRole,
  type WebUser,
} from "./client";

export const DEMO_CREDENTIALS: Record<WebRole, { email: string; password: string }> = {
  admin: {
    email: import.meta.env.VITE_DEMO_ADMIN_EMAIL ?? "admin@beachread.jp",
    password: import.meta.env.VITE_DEMO_ADMIN_PASSWORD ?? "admin@beachread.jp",
  },
  mangaka: {
    email: import.meta.env.VITE_DEMO_MANGAKA_EMAIL ?? "inoue@beachread.jp",
    password: import.meta.env.VITE_DEMO_MANGAKA_PASSWORD ?? "inoue@beachread.jp",
  },
  assistant: {
    email: import.meta.env.VITE_DEMO_ASSISTANT_EMAIL ?? "jun@beachread.jp",
    password: import.meta.env.VITE_DEMO_ASSISTANT_PASSWORD ?? "jun@beachread.jp",
  },
  editor: {
    email: import.meta.env.VITE_DEMO_EDITOR_EMAIL ?? "tanaka@beachread.jp",
    password: import.meta.env.VITE_DEMO_EDITOR_PASSWORD ?? "tanaka@beachread.jp",
  },
  board: {
    email: import.meta.env.VITE_DEMO_BOARD_EMAIL ?? "board@beachread.jp",
    password: import.meta.env.VITE_DEMO_BOARD_PASSWORD ?? "board@beachread.jp",
  },
};

type AuthPayload = {
  user: ApiUser;
  accessToken: string;
  refreshToken: string;
};

export async function loginWithPassword(email: string, password: string): Promise<WebUser> {
  const payload = await apiRequest<AuthPayload>("/auth/login", {
    method: "POST",
    auth: false,
    body: { email, password },
  });
  setApiTokens({ accessToken: payload.accessToken, refreshToken: payload.refreshToken });
  return mapApiUser(payload.user);
}

export function loginDemoRole(role: WebRole) {
  const credentials = DEMO_CREDENTIALS[role];
  return loginWithPassword(credentials.email, credentials.password);
}

export async function fetchMe(): Promise<WebUser> {
  const user = await apiRequest<ApiUser>("/auth/me");
  return mapApiUser(user);
}

export async function logoutLive() {
  try {
    await apiRequest("/auth/logout", { method: "POST", body: {} });
  } finally {
    clearApiTokens();
  }
}
