import { createFileRoute } from "@tanstack/react-router";
import { SeriesRankingsPage } from "@/features/board/series-rankings";

export const Route = createFileRoute("/app/board/rankings/")({
  component: SeriesRankingsPage,
});
