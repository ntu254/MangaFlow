import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { hasApiTokens } from "@/shared/api/client";
import { getPersistedAuthUser } from "@/shared/auth";

export const Route = createFileRoute("/app/admin")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const user = getPersistedAuthUser();
    if (!user) {
      throw redirect({ to: "/login" });
    }
    if (user.role !== "admin") {
      throw redirect({ to: "/app/dashboard" });
    }
    if (!hasApiTokens()) {
      throw redirect({ to: "/login" });
    }
  },
  component: () => <Outlet />,
});
