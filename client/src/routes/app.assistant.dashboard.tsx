import { createFileRoute } from "@tanstack/react-router";
import { AssistantDashboard } from "@/features/assistant/dashboard";

export const Route = createFileRoute("/app/assistant/dashboard")({
  head: () => ({
    meta: [
      { title: "Assistant Dashboard — beachRead Studio" },
      {
        name: "description",
        content: "Overview of Assistant tasks, deadlines, revisions, and earnings.",
      },
    ],
  }),
  component: AssistantDashboard,
});
