import { createFileRoute } from "@tanstack/react-router";
import { WorkflowMonitorPage } from "@/features/admin/workflow-monitor";

export const Route = createFileRoute("/app/admin/workflows")({
  head: () => ({ meta: [{ title: "Admin - Workflow Monitor - beachRead Studio" }] }),
  component: WorkflowMonitorPage,
});
