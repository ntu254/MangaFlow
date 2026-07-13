import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/submissions")({
  head: () => ({
    meta: [
      { title: "Series Proposals — beachRead Studio" },
      { name: "description", content: "Manage series proposals: Mangaka -> Editor -> Board." },
      { property: "og:title", content: "Series Proposals — beachRead Studio" },
      { property: "og:description", content: "Mangaka submits, Editor reviews, Board votes." },
    ],
  }),
  component: () => <Outlet />,
});
