import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/series/$id/")({
  loader: ({ params }) => {
    throw redirect({
      to: "/app/series/$id/overview",
      params: { id: params.id },
    });
  },
});
