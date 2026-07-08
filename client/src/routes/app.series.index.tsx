import { createFileRoute } from "@tanstack/react-router";
import { SeriesListPage } from "@/features/series/list";

export const Route = createFileRoute("/app/series/")({
  head: () => ({
    meta: [
      { title: "Series sản xuất — beachRead Studio" },
      {
        name: "description",
        content: "Production control center — quản lý series, chapter, task và review.",
      },
    ],
  }),
  component: SeriesListPage,
});
