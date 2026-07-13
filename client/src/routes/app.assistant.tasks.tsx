import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { MyTasksPage } from "@/features/assistant/tasks";

export const Route = createFileRoute("/app/assistant/tasks")({
  head: () => ({
    meta: [
      { title: "My Tasks — beachRead Studio" },
      { name: "description", content: "Assigned Assistant tasks." },
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
