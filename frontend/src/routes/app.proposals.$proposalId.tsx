import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ProposalDetailPage } from "@/features/proposals/detail";

const searchSchema = z.object({
  edit: z
    .preprocess((value) => value === true || value === 1 || value === "1", z.boolean())
    .optional(),
});

export const Route = createFileRoute("/app/proposals/$proposalId")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Proposal Detail — MangaFlow Studio" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const { proposalId } = Route.useParams();
  const { edit } = Route.useSearch();
  return <ProposalDetailPage proposalId={proposalId} editing={edit === true} />;
}
