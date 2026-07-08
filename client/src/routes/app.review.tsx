import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/review")({
  head: () => ({
    meta: [
      { title: "Review Queue — beachRead Studio" },
      { name: "description", content: "Danh sách submission chờ Mangaka review." },
    ],
  }),
  component: () => <Outlet />,
});
