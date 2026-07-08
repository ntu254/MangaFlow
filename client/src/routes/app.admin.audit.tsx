import { createFileRoute } from "@tanstack/react-router";
import { AdminAuditPage } from "@/features/admin/audit";

export const Route = createFileRoute("/app/admin/audit")({
  head: () => ({ meta: [{ title: "Admin - Audit Log - beachRead Studio" }] }),
  component: AdminAuditPage,
});
