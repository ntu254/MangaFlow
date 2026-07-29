import { createFileRoute } from "@tanstack/react-router";
import { ChapterReviewPage } from "@/features/editor/reviews";

export const Route = createFileRoute("/app/editor/chapters/$chapterId/review")({
  head: () => ({ meta: [{ title: "Chapter Review — MangaFlow Studio" }] }),
  component: ChapterReviewPage,
});
