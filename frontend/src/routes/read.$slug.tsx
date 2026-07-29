import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/read/$slug")({
  component: PublicSeriesLayout,
});

function PublicSeriesLayout() {
  return <Outlet />;
}
