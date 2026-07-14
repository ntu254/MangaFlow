import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/admin/settings")({
  head: () => ({
    meta: [
      { title: "Admin - Settings - beachRead Studio" },
      { name: "description", content: "System settings and operational boundaries." },
      { property: "og:title", content: "Admin - Settings" },
      { property: "og:description", content: "System settings." },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/app/admin/users" });
  },
});
