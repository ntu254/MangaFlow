import { createFileRoute } from "@tanstack/react-router";
import { BoardQueuePage } from "@/features/board/queue";

export const Route = createFileRoute("/app/board/queue")({
  component: BoardQueuePage,
});
