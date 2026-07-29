import { createFileRoute } from "@tanstack/react-router";
import { NotificationsPage } from "@/features/notifications";

export const Route = createFileRoute("/app/notifications")({
  head: () => ({ meta: [{ title: "Notifications — MangaFlow Studio" }] }),
  component: NotificationsPage,
});
