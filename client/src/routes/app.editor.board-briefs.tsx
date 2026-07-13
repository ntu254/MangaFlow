import { createFileRoute } from "@tanstack/react-router";
import { AtRiskReportsPage } from "@/features/editor/board-briefs";

export const Route = createFileRoute("/app/editor/board-briefs")({
  head: () => ({ meta: [{ title: "At-risk Reports — beachRead Studio" }] }),
  component: AtRiskReportsPage,
});
