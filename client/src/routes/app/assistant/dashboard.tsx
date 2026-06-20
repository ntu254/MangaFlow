import { createFileRoute } from "@tanstack/react-router";
import { AssistantDashboard } from "@/features/assistant/components/AssistantDashboard";

export const Route = createFileRoute("/app/assistant/dashboard")({
  component: AssistantDashboard,
});
