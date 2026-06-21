import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/board/")({
  beforeLoad: () => {
    throw redirect({ to: "/app/board/series-review" });
  },
});
