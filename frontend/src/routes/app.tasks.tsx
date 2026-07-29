import { createFileRoute } from "@tanstack/react-router";
import { TasksPage } from "@/features/series/tasks";

export const Route = createFileRoute("/app/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks — MangaFlow Studio" },
      { name: "description", content: "Chapters awaiting your action." },
    ],
  }),
  component: TasksPage,
});
