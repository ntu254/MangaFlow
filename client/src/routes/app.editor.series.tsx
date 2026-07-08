import { createFileRoute } from "@tanstack/react-router";
import { SeriesMonitorPage } from "@/features/editor/series-monitor";

export const Route = createFileRoute("/app/editor/series")({
  head: () => ({ meta: [{ title: "Series Monitor — beachRead Studio" }] }),
  component: SeriesMonitorPage,
});
