import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/submissions")({
  head: () => ({
    meta: [
      { title: "Series Proposals — beachRead Studio" },
      { name: "description", content: "Quản lý đề xuất series: Mangaka → Editor → Board." },
      { property: "og:title", content: "Series Proposals — beachRead Studio" },
      { property: "og:description", content: "Mangaka đề xuất, Editor review, Board vote." },
    ],
  }),
  component: () => <Outlet />,
});
