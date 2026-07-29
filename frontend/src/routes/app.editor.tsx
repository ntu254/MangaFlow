import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getPersistedAuthUser } from "@/shared/auth";

export const Route = createFileRoute("/app/editor")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const role = getPersistedAuthUser()?.role;
    if (role && role !== "editor") {
      throw redirect({ to: "/app/dashboard" });
    }
  },
  component: () => <Outlet />,
});
