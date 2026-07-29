import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getPersistedAuthUser } from "@/shared/auth";

export const Route = createFileRoute("/app/assistant")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const role = getPersistedAuthUser()?.role;
    if (role && role !== "assistant") {
      throw redirect({ to: "/app/dashboard" });
    }
  },
  component: () => <Outlet />,
});
