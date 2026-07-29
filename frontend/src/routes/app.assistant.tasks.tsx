import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { MyTasksPage } from "@/features/assistant/tasks";

export const Route = createFileRoute("/app/assistant/tasks")({
  head: () => ({
    meta: [
      { title: "My Tasks — MangaFlow Studio" },
      { name: "description", content: "List of tasks assigned to the Assistant." },
    ],
  }),
  component: AssistantTasksRoute,
});

function AssistantTasksRoute() {
  const location = useLocation();
  if (location.pathname === "/app/assistant/tasks") {
    return <MyTasksPage />;
  }
  return <Outlet />;
}
