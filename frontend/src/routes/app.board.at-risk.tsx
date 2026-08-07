import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/board/at-risk")({
  beforeLoad: () => {
    throw redirect({ to: "/app/board/dashboard" });
  },
});
