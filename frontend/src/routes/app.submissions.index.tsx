import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/submissions/")({
  beforeLoad: () => {
    throw redirect({ to: "/app/proposals" });
  },
});
