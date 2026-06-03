import React from "react";
import { Navigate } from "react-router-dom";
import type { SystemRole } from "../constants/roles";
import type { UserStatus } from "@/features/auth/auth-flow";

export type RoleGuardProps = {
  systemRole: SystemRole | null;
  status: UserStatus;
  allowedRoles: SystemRole[];
  children: React.ReactNode;
};

function getRoleHomePath(role: SystemRole | null): string {
  if (!role) return "/app/blocked";
  switch (role) {
    case "ADMIN": return "/app/admin/dashboard";
    case "MANGAKA": return "/app/mangaka/dashboard";
    case "ASSISTANT": return "/app/assistant/dashboard";
    case "EDITOR": return "/app/editor/dashboard";
    case "BOARD": return "/app/board/dashboard";
    default: return "/app/blocked";
  }
}

export function RoleGuard({ systemRole, status, allowedRoles, children }: RoleGuardProps) {
  if (status === "SUSPENDED") {
    return <Navigate to="/app/blocked" replace />;
  }

  if (!systemRole || !allowedRoles.includes(systemRole)) {
    return <Navigate to={getRoleHomePath(systemRole)} replace />;
  }

  return <>{children}</>;
}
