import { createFileRoute } from "@tanstack/react-router";
import { AdminMaterialsPage } from "@/features/admin/materials";

export const Route = createFileRoute("/app/admin/materials")({
  head: () => ({ meta: [{ title: "Admin - Material Library - beachRead Studio" }] }),
  component: AdminMaterialsPage,
});
