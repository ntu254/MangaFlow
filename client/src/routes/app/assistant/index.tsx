import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/assistant/")({
  beforeLoad: () => {
    throw redirect({ to: "/app/assistant/dashboard" });
  },
});
