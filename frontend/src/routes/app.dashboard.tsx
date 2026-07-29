import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/features/dashboard";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — MangaFlow Studio" },
      { name: "description", content: "Personalized workspace dashboard by role." },
      { property: "og:title", content: "Dashboard — MangaFlow Studio" },
      { property: "og:description", content: "Workspace dashboard." },
    ],
  }),
  component: DashboardPage,
});
