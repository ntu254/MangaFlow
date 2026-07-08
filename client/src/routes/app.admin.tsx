import { createFileRoute, isRedirect, Outlet, redirect } from "@tanstack/react-router";
import { hasApiTokens } from "@/shared/api/client";

export const Route = createFileRoute("/app/admin")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    let role: string | undefined;
    try {
      const raw = window.localStorage.getItem("beachread-auth");
      const parsed = raw ? (JSON.parse(raw) as { state?: { user?: { role?: string } } }) : null;
      role = parsed?.state?.user?.role;
    } catch (error) {
      if (isRedirect(error)) throw error;
    }
    if (!role) {
      throw redirect({ to: "/login" });
    }
    if (role !== "admin") {
      throw redirect({ to: "/app/dashboard" });
    }
    if (!hasApiTokens()) {
      throw redirect({ to: "/login" });
    }
  },
  component: () => <Outlet />,
});
