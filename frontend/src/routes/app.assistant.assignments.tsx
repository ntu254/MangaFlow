import { createFileRoute } from "@tanstack/react-router";
import { AssistantAssignmentsPage } from "@/features/assistant/assignments";

export const Route = createFileRoute("/app/assistant/assignments")({
  head: () => ({
    meta: [
      { title: "Page Assignments — MangaFlow Studio" },
      {
        name: "description",
        content: "Review, accept, or decline page assignments sent by series Mangakas.",
      },
    ],
  }),
  component: AssistantAssignmentsPage,
});
