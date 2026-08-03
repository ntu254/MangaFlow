import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/submissions/new")({
  beforeLoad: () => {
    throw redirect({ to: "/app/proposals/new" });
  },
});
