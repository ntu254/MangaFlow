import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/admin/audit")({
  head: () => ({ meta: [{ title: "Admin - Audit Log - beachRead Studio" }] }),
  beforeLoad: () => {
    throw redirect({ to: "/app/admin/users" });
  },
});
