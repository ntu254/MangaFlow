import { createFileRoute } from "@tanstack/react-router";
import { AssistantDashboard } from "@/features/assistant/dashboard";

export const Route = createFileRoute("/app/assistant/dashboard")({
  head: () => ({
    meta: [
      { title: "Assistant Dashboard — MangaFlow Studio" },
      {
        name: "description",
        content: "Overview of tasks, deadlines, revisions, and earnings for the Assistant.",
      },
    ],
  }),
  component: AssistantDashboard,
});
