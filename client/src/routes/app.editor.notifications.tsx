import { createFileRoute } from "@tanstack/react-router";
import { EditorNotificationsPage } from "@/features/editor/notifications";

export const Route = createFileRoute("/app/editor/notifications")({
  head: () => ({ meta: [{ title: "Notifications — MangaFlow" }] }),
  component: EditorNotificationsPage,
});
