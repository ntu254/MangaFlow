import { createFileRoute } from "@tanstack/react-router";
import { AssistantTasksList } from "@/features/assistant/components/AssistantTasksList";

export const Route = createFileRoute("/app/assistant/tasks")({
  component: AssistantTasksList,
});
