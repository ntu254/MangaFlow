import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { EmptyState } from "@/shared/ui/empty-state";
import { useVotingSessionQuery } from "@/features/board/sessions/api/sessions.queries";

export const Route = createFileRoute("/app/board/sessions/$sid")({
  component: SessionDetailRoute,
});

function SessionDetailRoute() {
  const { sid } = Route.useParams();
  const navigate = useNavigate();
  const { data: session, isLoading, isError } = useVotingSessionQuery(sid);
  const proposalId = session?.proposalIds[0];

  useEffect(() => {
    if (proposalId) {
      void navigate({
        to: "/app/board/proposals/$proposalId",
        params: { proposalId },
        replace: true,
      });
    }
  }, [navigate, proposalId]);

  if (isLoading) {
    return <p className="p-8 text-center text-xs text-muted-foreground">Opening proposal review…</p>;
  }

  if (isError || !proposalId) {
    return (
      <EmptyState
        title="Review record not found"
        description="Return to the Board Review queue."
        action={
          <Link to="/app/board/queue" className="text-xs underline">
            Board Review
          </Link>
        }
      />
    );
  }

  return null;
}
