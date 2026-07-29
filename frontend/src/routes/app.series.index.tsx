import { createFileRoute } from "@tanstack/react-router";
import { SeriesListPage } from "@/features/series/list";

export const Route = createFileRoute("/app/series/")({
  head: () => ({
    meta: [
      { title: "Production Series — MangaFlow Studio" },
      {
        name: "description",
        content: "Production control center — manage series, chapters, tasks, and reviews.",
      },
    ],
  }),
  component: SeriesListPage,
});
