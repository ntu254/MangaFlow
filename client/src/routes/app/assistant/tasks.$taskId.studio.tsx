import { createFileRoute } from "@tanstack/react-router";
import { AssistantTaskStudio } from "@/features/assistant/components/AssistantTaskStudio";

export const Route = createFileRoute("/app/assistant/tasks/$taskId/studio")({
  component: RouteComponent,
});

function RouteComponent() {
  const { taskId } = Route.useParams();
  return <AssistantTaskStudio taskId={taskId} />;
}
