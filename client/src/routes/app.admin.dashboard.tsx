import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/admin/dashboard")({
  head: () => ({ meta: [{ title: "Admin - Dashboard - beachRead Studio" }] }),
  beforeLoad: () => {
    throw redirect({ to: "/app/admin/users" });
  },
});
