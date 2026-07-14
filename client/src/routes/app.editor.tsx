import { createFileRoute, isRedirect, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/editor")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    let role: string | undefined;
    try {
      const raw = window.localStorage.getItem("mangaflow-auth");
      const parsed = raw ? (JSON.parse(raw) as { state?: { user?: { role?: string } } }) : null;
      role = parsed?.state?.user?.role;
    } catch (e) {
      if (isRedirect(e)) throw e;
    }
    if (role && role !== "editor") {
      throw redirect({ to: "/app/dashboard" });
    }
  },
  component: () => <Outlet />,
});
