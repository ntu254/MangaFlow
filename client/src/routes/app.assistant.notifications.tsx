import { createFileRoute } from "@tanstack/react-router";
import { AssistantNotificationsPage } from "@/features/assistant/notifications";

export const Route = createFileRoute("/app/assistant/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — MangaFlow" },
      { name: "description", content: "Assistant notifications." },
    ],
  }),
  component: AssistantNotificationsPage,
});
