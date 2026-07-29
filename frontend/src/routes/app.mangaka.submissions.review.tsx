import { createFileRoute } from "@tanstack/react-router";
import { ReviewQueuePage } from "@/features/mangaka/reviews";

export const Route = createFileRoute("/app/mangaka/submissions/review")({
  head: () => ({
    meta: [
      { title: "Mangaka Submission Review - MangaFlow Studio" },
      { name: "description", content: "Submission queue waiting for Mangaka review." },
    ],
  }),
  component: ReviewQueuePage,
});
