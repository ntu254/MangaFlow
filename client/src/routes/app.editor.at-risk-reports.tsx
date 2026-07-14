import { createFileRoute } from "@tanstack/react-router";
import { AtRiskReportsPage } from "@/features/editor/at-risk-reports";

export const Route = createFileRoute("/app/editor/at-risk-reports")({
  head: () => ({ meta: [{ title: "At-risk Reports — MangaFlow" }] }),
  component: AtRiskReportsPage,
});
