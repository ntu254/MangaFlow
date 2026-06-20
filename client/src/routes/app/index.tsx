import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const role = window.localStorage.getItem("mangaflow.role");
      if (role === "assistant") {
        throw redirect({ to: "/app/assistant/dashboard" });
      }
    }
    throw redirect({ to: "/app/dashboard" });
  },
});
