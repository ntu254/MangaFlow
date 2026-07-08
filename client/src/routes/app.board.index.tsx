import { createFileRoute, redirect } from "@tanstack/react-router";
import { BoardVotingQueuePage } from "@/features/board/queue";

export const Route = createFileRoute("/app/board/")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("beachread-auth");
    const parsed = raw ? (JSON.parse(raw) as { state?: { user?: { role?: string } } }) : null;
    if (parsed?.state?.user?.role === "board") throw redirect({ to: "/app/board/dashboard" });
  },
  component: BoardVotingQueuePage,
});
