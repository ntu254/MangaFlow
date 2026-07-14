import { createFileRoute } from "@tanstack/react-router";
import { NewProposalPage } from "@/features/proposals/create";

export const Route = createFileRoute("/app/submissions/new")({
  head: () => ({
    meta: [{ title: "New Series Proposal — MangaFlow" }],
  }),
  component: NewProposalPage,
});
