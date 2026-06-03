import { Navigate } from "react-router-dom";
import { useAuthClaims } from "@/shared/hooks/useAuthClaims";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fff9fb] via-[#f8f1ff] to-[#fff7ec]">
      <div className="flex flex-col items-center gap-4">
        <div className="size-10 animate-spin rounded-full border-4 border-[#eadff6] border-t-[#9065d5]" />
        <p className="text-sm text-[#5f5270]">Loading MangaFlow...</p>
      </div>
    </div>
  );
}

const roleRoutes: Record<string, string> = {
  ADMIN: "/app/admin/dashboard",
  MANGAKA: "/app/mangaka/dashboard",
  ASSISTANT: "/app/assistant/dashboard",
  EDITOR: "/app/editor/dashboard",
  BOARD: "/app/board/dashboard"
};

export function RoleRedirect() {
  const { claims, isLoading } = useAuthClaims();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!claims) {
    return <Navigate to="/app/onboarding" replace />;
  }

  if (claims.status === "SUSPENDED") {
    return <Navigate to="/app/blocked" replace />;
  }

  if (!claims.systemRole) {
    return <Navigate to="/app/onboarding" replace />;
  }

  return <Navigate to={roleRoutes[claims.systemRole] ?? "/app/onboarding"} replace />;
}
