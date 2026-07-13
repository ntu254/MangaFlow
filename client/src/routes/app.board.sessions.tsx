import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/board/sessions")({
  head: () => ({
    meta: [
      { title: "Voting sessions — beachRead Studio" },
      { name: "description", content: "Board voting sessions: ad-hoc and scheduled." },
    ],
  }),
  component: () => <Outlet />,
});
