import { createFileRoute, redirect } from "@tanstack/react-router";
import { RankingsPage } from "@/features/series/rankings";
import { getPersistedAuthUser } from "@/shared/auth";

export const Route = createFileRoute("/app/rankings")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const user = getPersistedAuthUser();
    if (!user || !["mangaka", "editor", "board"].includes(user.role)) {
      throw redirect({ to: "/app/dashboard" });
    }
  },
  head: () => ({
    meta: [
      { title: "Rankings & Reviews — MangaFlow Studio" },
      {
        name: "description",
        content: "View scores, vote counts, and reader risk metrics for each title.",
      },
    ],
  }),
  component: RankingsPage,
});
