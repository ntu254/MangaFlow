import { createFileRoute } from "@tanstack/react-router";
import { BoardBriefsPage } from "@/features/editor/board-briefs";

export const Route = createFileRoute("/app/editor/board-briefs")({
  head: () => ({ meta: [{ title: "Board Briefs — beachRead Studio" }] }),
  component: BoardBriefsPage,
});
