import { createFileRoute } from "@tanstack/react-router";
import { ReviewQueuePage } from "@/features/mangaka/reviews";

export const Route = createFileRoute("/app/review/")({
  head: () => ({
    meta: [
      { title: "Review Queue — MangaFlow" },
      { name: "description", content: "Submissions awaiting Mangaka review." },
    ],
  }),
  component: ReviewQueuePage,
});
