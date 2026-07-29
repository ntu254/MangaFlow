import { createFileRoute } from "@tanstack/react-router";
import { ReviewQueuePage } from "@/features/editor/review-queue";

export const Route = createFileRoute("/app/editor/review/")({
  head: () => ({ meta: [{ title: "Review Queue — MangaFlow Studio" }] }),
  component: ReviewQueuePage,
});
