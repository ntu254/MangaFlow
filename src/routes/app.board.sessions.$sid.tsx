import { createFileRoute } from "@tanstack/react-router";
import { SessionDetailPage } from "@/features/board";

export const Route = createFileRoute("/app/board/sessions/$sid")({
  component: SessionDetailRoute,
});

function SessionDetailRoute() {
  const { sid } = Route.useParams();
  return <SessionDetailPage sessionId={sid} />;
}
