import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/board/$id")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/app/board/proposals/$proposalId",
      params: { proposalId: params.id },
      replace: true,
    });
  },
});
