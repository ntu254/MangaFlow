import { createFileRoute } from "@tanstack/react-router";
import { AssistantMySeries } from "@/features/assistant/components/AssistantMySeries";

export const Route = createFileRoute("/app/assistant/series")({
  component: AssistantMySeries,
});
