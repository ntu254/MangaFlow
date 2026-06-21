import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { AssistantTasksList } from "@/features/assistant/components/AssistantTasksList";

export const Route = createFileRoute("/app/assistant/tasks")({
  component: AssistantTasksRoute,
});

function AssistantTasksRoute() {
  const location = useLocation();
  const isTaskStudioRoute =
    location.pathname.startsWith("/app/assistant/tasks/") &&
    location.pathname.endsWith("/studio");

  return isTaskStudioRoute ? <Outlet /> : <AssistantTasksList />;
}
