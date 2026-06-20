import { api, unwrap } from "./_client";

export type ServerRole = "ADMIN" | "MANGAKA" | "EDITOR" | "ASSISTANT" | "BOARD";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  displayName?: string;
  role: ServerRole;
  isActive: boolean;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  redirectTo?: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }).then(unwrap<LoginResponse>),

  me: () => api.get("/auth/me").then(unwrap<AuthUser>),

  logout: (refreshToken: string | null) =>
    api.post("/auth/logout", { refreshToken }).then((r) => r.data),
};
