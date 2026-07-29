import { createFileRoute } from "@tanstack/react-router";
import { AdminRateTablePage } from "@/features/admin/rate-table";

export const Route = createFileRoute("/app/admin/rates")({
  head: () => ({
    meta: [
      { title: "Admin - Rate Table - MangaFlow Studio" },
      { name: "description", content: "Admin-only work-rate policy configuration." },
    ],
  }),
  component: AdminRateTablePage,
});
