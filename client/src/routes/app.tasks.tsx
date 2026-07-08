import { createFileRoute } from "@tanstack/react-router";
import { TasksPage } from "@/features/series/tasks";

export const Route = createFileRoute("/app/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks — beachRead Studio" },
      { name: "description", content: "Các chapter đang chờ action của bạn." },
    ],
  }),
  component: TasksPage,
});
