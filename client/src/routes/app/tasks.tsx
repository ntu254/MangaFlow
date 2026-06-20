import { createFileRoute, redirect } from "@tanstack/react-router";
import { TasksWorkspace } from "@/features/tasks/components/TasksWorkspace";

export const Route = createFileRoute("/app/tasks")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const role = window.localStorage.getItem("mangaflow.role");
      if (role === "assistant") {
        throw redirect({ to: "/app/assistant/tasks" });
      }
    }
  },
  component: TasksWorkspace,
});
