import { createFileRoute } from "@tanstack/react-router";
import { NewProposalPage } from "@/features/proposals/create";

export const Route = createFileRoute("/app/proposals/new")({
  head: () => ({
    meta: [{ title: "New Series Proposal — MangaFlow Studio" }],
  }),
  component: NewProposalPage,
});
