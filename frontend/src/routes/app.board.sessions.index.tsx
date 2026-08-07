import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/board/sessions/")({
  beforeLoad: () => {
    throw redirect({ to: "/app/board/queue" });
  },
});
