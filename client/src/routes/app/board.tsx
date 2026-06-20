import { createFileRoute } from "@tanstack/react-router";
import { BoardView } from "@/features/board/components/BoardView";

export const Route = createFileRoute("/app/board")({
  component: BoardView,
});
