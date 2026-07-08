import { createFileRoute } from "@tanstack/react-router";
import { AtRiskReviewsPage } from "@/features/board/at-risk";

export const Route = createFileRoute("/app/board/at-risk")({
  component: AtRiskReviewsPage,
});
