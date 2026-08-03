import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/proposals")({
  head: () => ({
    meta: [
      { title: "Series Proposals — MangaFlow Studio" },
      { name: "description", content: "Manage series proposals: Mangaka → Editor → Board." },
      { property: "og:title", content: "Series Proposals — MangaFlow Studio" },
      { property: "og:description", content: "Mangaka proposes, Editor reviews, Board votes." },
    ],
  }),
  component: () => <Outlet />,
});
