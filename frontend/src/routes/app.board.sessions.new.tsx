import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/board/sessions/new")({
  beforeLoad: () => {
    throw redirect({ to: "/app/board/queue" });
  },
});
