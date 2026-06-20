import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/assistant")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const role = window.localStorage.getItem("mangaflow.role");
    if (role && role !== "assistant") {
      throw redirect({ to: "/app/dashboard" });
    }
  },
  component: () => <Outlet />,
});
