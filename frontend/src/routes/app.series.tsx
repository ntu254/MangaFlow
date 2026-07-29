import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/series")({
  head: () => ({
    meta: [
      { title: "Series — MangaFlow Studio" },
      {
        name: "description",
        content: "Manage production series, chapters, and publishing schedules.",
      },
      { property: "og:title", content: "Series — MangaFlow Studio" },
      { property: "og:description", content: "Manage series and chapters." },
    ],
  }),
  component: () => <Outlet />,
});
