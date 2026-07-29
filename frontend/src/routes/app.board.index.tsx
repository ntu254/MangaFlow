import { createFileRoute, redirect } from "@tanstack/react-router";
import { BoardVotingQueuePage } from "@/features/board/queue";
import { getPersistedAuthUser } from "@/shared/auth";

export const Route = createFileRoute("/app/board/")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (getPersistedAuthUser()?.role === "board") {
      throw redirect({ to: "/app/board/dashboard" });
    }
  },
  component: BoardVotingQueuePage,
});
