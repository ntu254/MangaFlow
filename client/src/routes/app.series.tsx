import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/series")({
  head: () => ({
    meta: [
      { title: "Series — MangaFlow" },
      {
        name: "description",
        content: "Manage production series, chapters, and publication schedules.",
      },
      { property: "og:title", content: "Series — MangaFlow" },
      { property: "og:description", content: "Manage series and chapters." },
    ],
  }),
  component: () => <Outlet />,
});
