import { createFileRoute } from "@tanstack/react-router";
import { RankingImportPage } from "@/features/board/rankings";

export const Route = createFileRoute("/app/board/rankings/import")({
  component: RankingImportPage,
});
