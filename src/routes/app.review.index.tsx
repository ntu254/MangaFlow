import { createFileRoute } from "@tanstack/react-router";
import { ReviewQueuePage } from "@/features/mangaka/reviews";

export const Route = createFileRoute("/app/review/")({
  head: () => ({
    meta: [
      { title: "Review Queue — beachRead Studio" },
      { name: "description", content: "Danh sách submission chờ Mangaka review." },
    ],
  }),
  component: ReviewQueuePage,
});
