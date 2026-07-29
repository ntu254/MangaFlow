import { createFileRoute } from "@tanstack/react-router";
import { ProposalReviewPage } from "@/features/editor/proposal-review";

export const Route = createFileRoute("/app/editor/proposals/$proposalId")({
  head: () => ({ meta: [{ title: "Proposal Review — MangaFlow Studio" }] }),
  component: ProposalReviewPage,
});
