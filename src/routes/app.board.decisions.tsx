import { createFileRoute } from "@tanstack/react-router";
import { DecisionHistoryPage } from "@/features/board/decisions";

export const Route = createFileRoute("/app/board/decisions")({
  component: DecisionHistoryPage,
});
