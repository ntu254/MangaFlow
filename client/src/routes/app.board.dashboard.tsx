import { createFileRoute } from "@tanstack/react-router";
import { BoardDashboard } from "@/features/board/dashboard";

export const Route = createFileRoute("/app/board/dashboard")({
  component: BoardDashboard,
});
