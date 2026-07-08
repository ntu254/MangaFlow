import { createFileRoute } from "@tanstack/react-router";
import { StudiosPage } from "@/features/admin/studios";

export const Route = createFileRoute("/app/admin/studios")({
  head: () => ({ meta: [{ title: "Admin - Studios and Teams - beachRead Studio" }] }),
  component: StudiosPage,
});
