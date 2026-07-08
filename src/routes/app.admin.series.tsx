import { createFileRoute } from "@tanstack/react-router";
import { SeriesManagementPage } from "@/features/admin/series-management";

export const Route = createFileRoute("/app/admin/series")({
  head: () => ({ meta: [{ title: "Admin - Series - beachRead Studio" }] }),
  component: SeriesManagementPage,
});
