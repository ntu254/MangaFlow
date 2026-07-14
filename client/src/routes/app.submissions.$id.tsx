import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ProposalDetailPage } from "@/features/proposals/detail";

const searchSchema = z.object({
  edit: z
    .preprocess((value) => value === true || value === 1 || value === "1", z.boolean())
    .optional(),
});

export const Route = createFileRoute("/app/submissions/$id")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Proposal detail — MangaFlow" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const { edit } = Route.useSearch();
  return <ProposalDetailPage proposalId={id} editing={edit === true} />;
}
