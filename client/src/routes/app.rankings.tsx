import { createFileRoute } from "@tanstack/react-router";
import { RankingsPage } from "@/features/series/rankings";

export const Route = createFileRoute("/app/rankings")({
  head: () => ({
    meta: [
      { title: "Rankings & Reviews — MangaFlow" },
      {
        name: "description",
        content: "View scores, vote counts, and reader risk indicators for works.",
      },
    ],
  }),
  component: RankingsPage,
});
