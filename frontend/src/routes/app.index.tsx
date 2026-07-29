import { createFileRoute, redirect } from "@tanstack/react-router";
import { getPersistedAuthUser } from "@/shared/auth";

export const Route = createFileRoute("/app/")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const role = getPersistedAuthUser()?.role;
    if (role === "assistant") throw redirect({ to: "/app/assistant/dashboard" });
    if (role === "editor") throw redirect({ to: "/app/editor/dashboard" });
    if (role === "board") throw redirect({ to: "/app/board/dashboard" });
    if (role === "admin") throw redirect({ to: "/app/admin/dashboard" });
    throw redirect({ to: "/app/dashboard" });
  },
  component: () => null,
});
