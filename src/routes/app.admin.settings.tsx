import { createFileRoute } from "@tanstack/react-router";
import { AdminSettingsPage } from "@/features/admin/settings";

export const Route = createFileRoute("/app/admin/settings")({
  head: () => ({
    meta: [
      { title: "Admin - Settings - beachRead Studio" },
      { name: "description", content: "System settings and operational boundaries." },
      { property: "og:title", content: "Admin - Settings" },
      { property: "og:description", content: "System settings." },
    ],
  }),
  component: AdminSettingsPage,
});
