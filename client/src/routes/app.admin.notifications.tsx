import { createFileRoute } from "@tanstack/react-router";
import { AdminNotificationsPage } from "@/features/admin/notifications";

export const Route = createFileRoute("/app/admin/notifications")({
  head: () => ({ meta: [{ title: "Admin - Notifications - beachRead Studio" }] }),
  component: AdminNotificationsPage,
});
