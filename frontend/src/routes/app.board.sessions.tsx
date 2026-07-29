import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/board/sessions")({
  head: () => ({
    meta: [
      { title: "Voting sessions — MangaFlow Studio" },
      { name: "description", content: "Board voting sessions: ad-hoc & scheduled." },
    ],
  }),
  component: () => <Outlet />,
});
