import { createFileRoute } from "@tanstack/react-router";
import { SubmissionsPage } from "@/features/assistant/submissions";

export const Route = createFileRoute("/app/assistant/submissions")({
  head: () => ({
    meta: [
      { title: "Submissions — MangaFlow Studio" },
      { name: "description", content: "Track submitted submissions." },
    ],
  }),
  component: SubmissionsPage,
});
