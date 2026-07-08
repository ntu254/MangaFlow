import { createFileRoute } from "@tanstack/react-router";
import { ProposalDecisionDetail } from "@/features/board/queue";

function ProposalDecisionDetailRoute() {
  const { proposalId } = Route.useParams();
  return <ProposalDecisionDetail proposalId={proposalId} />;
}

export const Route = createFileRoute("/app/board/proposals/$proposalId")({
  component: ProposalDecisionDetailRoute,
});
