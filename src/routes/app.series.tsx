import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/series")({
  head: () => ({
    meta: [
      { title: "Series — beachRead Studio" },
      { name: "description", content: "Quản lý series sản xuất, chapter, lịch xuất bản." },
      { property: "og:title", content: "Series — beachRead Studio" },
      { property: "og:description", content: "Quản lý series và chapter." },
    ],
  }),
  component: () => <Outlet />,
});
