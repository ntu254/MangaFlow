import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/review")({
  head: () => ({
    meta: [
      { title: "Review Queue — MangaFlow" },
      { name: "description", content: "Submissions awaiting Mangaka review." },
    ],
  }),
  component: () => <Outlet />,
});
