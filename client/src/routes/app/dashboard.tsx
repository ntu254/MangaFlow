import { createFileRoute } from "@tanstack/react-router";
import { DashboardView } from "@/features/dashboard/components/DashboardView";

export const Route = createFileRoute("/app/dashboard")({
  component: DashboardView,
});
