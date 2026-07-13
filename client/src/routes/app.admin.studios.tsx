import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/admin/studios")({
  head: () => ({ meta: [{ title: "Admin - Studios and Teams - beachRead Studio" }] }),
  beforeLoad: () => {
    throw redirect({ to: "/app/admin/users" });
  },
});
