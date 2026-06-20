import { createFileRoute } from "@tanstack/react-router";
import { AssistantSubmissions } from "@/features/assistant/components/AssistantSubmissions";

export const Route = createFileRoute("/app/assistant/submissions")({
  component: AssistantSubmissions,
});
