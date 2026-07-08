import { createFileRoute } from "@tanstack/react-router";
import { AssistantNotificationsPage } from "@/features/assistant/notifications";

export const Route = createFileRoute("/app/assistant/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — beachRead Studio" },
      { name: "description", content: "Thông báo dành cho Assistant." },
    ],
  }),
  component: AssistantNotificationsPage,
});
