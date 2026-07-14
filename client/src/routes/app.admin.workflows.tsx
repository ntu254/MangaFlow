import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/admin/workflows")({
  head: () => ({ meta: [{ title: "Admin - Workflow Monitor - beachRead Studio" }] }),
  beforeLoad: () => {
    throw redirect({ to: "/app/admin/users" });
  },
});
