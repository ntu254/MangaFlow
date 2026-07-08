import { createFileRoute } from "@tanstack/react-router";
import { BoardVotePage } from "@/features/board/vote";

export const Route = createFileRoute("/app/board/$id")({
  component: BoardVoteRoute,
});

function BoardVoteRoute() {
  const { id } = Route.useParams();
  return <BoardVotePage id={id} />;
}
