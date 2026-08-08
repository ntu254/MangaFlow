import { createFileRoute } from "@tanstack/react-router";
import { ChapterReviewPage } from "@/features/editor/reviews";

export const Route = createFileRoute("/app/editor/chapters/$chapterId/annotate")({
  head: () => ({ meta: [{ title: "Annotate Chapter — MangaFlow Studio" }] }),
  component: () => <ChapterReviewPage initialAnnotationMode />,
});
