import { createFileRoute } from "@tanstack/react-router";
import { TasksPage } from "@/features/series/tasks";

export const Route = createFileRoute("/app/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks — MangaFlow" },
      { name: "description", content: "Your chapters awaiting action." },
    ],
  }),
  component: TasksPage,
});
