import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/editor/review")({
  head: () => ({ meta: [{ title: "Review Queue — beachRead Studio" }] }),
  component: () => <Outlet />,
});
