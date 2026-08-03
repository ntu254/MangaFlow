import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getPersistedAuthUser } from "@/shared/auth";

export const Route = createFileRoute("/app/board")({
  head: () => ({
    meta: [
      { title: "Board Vote — MangaFlow Studio" },
      { name: "description", content: "Board proposal voting." },
    ],
  }),
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const user = getPersistedAuthUser();
    if (user?.role && user.role !== "board") {
      throw redirect({ to: "/app/dashboard" });
    }
  },
  component: () => <Outlet />,
});
