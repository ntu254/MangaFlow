import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/admin/series")({
  head: () => ({ meta: [{ title: "Admin - Series - beachRead Studio" }] }),
  beforeLoad: () => {
    throw redirect({ to: "/app/admin/users" });
  },
});
