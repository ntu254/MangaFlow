import { createFileRoute } from "@tanstack/react-router";
import { BoardNotificationsPage } from "@/features/board/notifications";

export const Route = createFileRoute("/app/board/notifications")({
  component: BoardNotificationsPage,
});
