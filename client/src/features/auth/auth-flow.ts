export type SystemRole = "ADMIN" | "MANGAKA" | "ASSISTANT" | "EDITOR" | "BOARD";
export type UserStatus = "ACTIVE" | "SUSPENDED";

export type AuthRouteUser = {
  systemRole: SystemRole | null;
  status: UserStatus;
};

export type AuthRouteInput = {
  isSignedIn: boolean;
  user: AuthRouteUser | null;
};

const roleRoutes: Record<SystemRole, string> = {
  ADMIN: "/app/admin/dashboard",
  MANGAKA: "/app/mangaka/dashboard",
  ASSISTANT: "/app/assistant/dashboard",
  EDITOR: "/app/editor/dashboard",
  BOARD: "/app/board/dashboard"
};

export function resolveAuthRoute(input: AuthRouteInput) {
  if (!input.isSignedIn) {
    return "/sign-in";
  }

  if (!input.user) {
    return "/app/blocked";
  }

  if (input.user.status === "SUSPENDED") {
    return "/app/blocked";
  }

  if (!input.user.systemRole) {
    return "/app/blocked";
  }

  return roleRoutes[input.user.systemRole];
}

