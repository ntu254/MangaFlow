import { createFileRoute } from "@tanstack/react-router";
import { SubmissionsPage } from "@/features/assistant/submissions";

export const Route = createFileRoute("/app/assistant/submissions")({
  head: () => ({
    meta: [
      { title: "Submissions — beachRead Studio" },
      { name: "description", content: "Theo dõi submission đã nộp." },
    ],
  }),
  component: SubmissionsPage,
});
