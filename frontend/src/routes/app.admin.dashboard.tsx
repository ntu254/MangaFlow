import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboard } from "@/features/admin/dashboard";

export const Route = createFileRoute("/app/admin/dashboard")({
  head: () => ({ meta: [{ title: "Admin - Dashboard - MangaFlow Studio" }] }),
  component: AdminDashboard,
});
