import { createFileRoute } from "@tanstack/react-router";
import { AssistantEarnings } from "@/features/assistant/components/AssistantEarnings";

export const Route = createFileRoute("/app/assistant/earnings")({
  component: AssistantEarnings,
});
