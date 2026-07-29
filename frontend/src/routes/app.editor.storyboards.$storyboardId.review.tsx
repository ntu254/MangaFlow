import { createFileRoute } from "@tanstack/react-router";
import { StoryboardReviewPage } from "@/features/editor/reviews";

export const Route = createFileRoute("/app/editor/storyboards/$storyboardId/review")({
  head: () => ({ meta: [{ title: "Storyboard Review — MangaFlow Studio" }] }),
  component: StoryboardReviewPage,
});
