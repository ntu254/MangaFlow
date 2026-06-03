import React from "react";
import { Navigate } from "react-router-dom";
import type { SystemRole } from "../constants/roles";
import type { AuthRouteUser } from "@/features/auth/auth-flow";

export type RoleGuardProps = {
  user: AuthRouteUser | null;
  allowedRoles: SystemRole[];
  children: React.ReactNode;
};

function getRoleHomePath(role: SystemRole | null): string {
  if (!role) return "/app/onboarding";
  switch (role) {
    case "ADMIN": return "/app/admin/dashboard";
    case "MANGAKA": return "/app/mangaka/dashboard";
    case "ASSISTANT": return "/app/assistant/dashboard";
    case "EDITOR": return "/app/editor/dashboard";
    case "BOARD": return "/app/board/dashboard";
    default: return "/app/onboarding";
  }
}

export function RoleGuard({ user, allowedRoles, children }: RoleGuardProps) {
  if (!user || !user.systemRole || !allowedRoles.includes(user.systemRole as SystemRole)) {
    return <Navigate to={getRoleHomePath(user?.systemRole ?? null)} replace />;
  }

  return <>{children}</>;
}
