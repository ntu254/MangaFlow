import { createFileRoute, isRedirect, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("beachread-auth");
      const parsed = raw ? (JSON.parse(raw) as { state?: { user?: { role?: string } } }) : null;
      if (parsed?.state?.user?.role === "assistant") {
        throw redirect({ to: "/app/assistant/dashboard" });
      }
      if (parsed?.state?.user?.role === "editor") {
        throw redirect({ to: "/app/editor/dashboard" });
      }
      if (parsed?.state?.user?.role === "board") {
        throw redirect({ to: "/app/board/dashboard" });
      }
      if (parsed?.state?.user?.role === "admin") {
        throw redirect({ to: "/app/admin/dashboard" });
      }
    } catch (error) {
      if (isRedirect(error)) throw error;
      /* fall through */
    }
    throw redirect({ to: "/app/dashboard" });
  },
  component: () => null,
});
