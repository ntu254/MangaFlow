import { createFileRoute } from "@tanstack/react-router";
import { AssistantDashboard } from "@/features/assistant/dashboard";

export const Route = createFileRoute("/app/assistant/dashboard")({
  head: () => ({
    meta: [
      { title: "Assistant Dashboard — beachRead Studio" },
      {
        name: "description",
        content: "Tổng quan task, deadline, revision và earning của Assistant.",
      },
    ],
  }),
  component: AssistantDashboard,
});
