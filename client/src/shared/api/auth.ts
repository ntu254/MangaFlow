import {
  apiRequest,
  clearApiTokens,
  mapApiUser,
  setApiTokens,
  type ApiUser,
  type WebRole,
  type WebUser,
} from "./client";

const getEnv = (key: string, fallback: string): string => {
  return (
    import.meta.env?.[key] ??
    (typeof process !== "undefined" ? process.env?.[key] : undefined) ??
    fallback
  );
};

export const DEMO_CREDENTIALS: Record<WebRole, { email: string; password: string }> = {
  admin: {
    email: getEnv("VITE_DEMO_ADMIN_EMAIL", "admin@beachread.jp"),
    password: getEnv("VITE_DEMO_ADMIN_PASSWORD", "admin@beachread.jp"),
  },
  mangaka: {
    email: getEnv("VITE_DEMO_MANGAKA_EMAIL", "inoue@beachread.jp"),
    password: getEnv("VITE_DEMO_MANGAKA_PASSWORD", "inoue@beachread.jp"),
  },
  assistant: {
    email: getEnv("VITE_DEMO_ASSISTANT_EMAIL", "jun@beachread.jp"),
    password: getEnv("VITE_DEMO_ASSISTANT_PASSWORD", "jun@beachread.jp"),
  },
  editor: {
    email: getEnv("VITE_DEMO_EDITOR_EMAIL", "tanaka@beachread.jp"),
    password: getEnv("VITE_DEMO_EDITOR_PASSWORD", "tanaka@beachread.jp"),
  },
  board: {
    email: getEnv("VITE_DEMO_BOARD_EMAIL", "board@beachread.jp"),
    password: getEnv("VITE_DEMO_BOARD_PASSWORD", "board@beachread.jp"),
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
