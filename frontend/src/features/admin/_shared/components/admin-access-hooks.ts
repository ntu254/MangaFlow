import { hasApiTokens } from "@/shared/api/client";
import { useAuth } from "@/shared/auth";

export type AdminAccessDenial = "session" | "role" | null;

export function useAdminAccess() {
  const user = useAuth((state) => state.user);
  const hasSession = hasApiTokens();
  const isAdmin = user?.role === "admin";
  const denial: AdminAccessDenial = !user || !hasSession ? "session" : !isAdmin ? "role" : null;

  return {
    user,
    hasSession,
    isAdmin,
    canQueryAdmin: denial === null,
    denial,
  };
}
