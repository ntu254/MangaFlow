import { createFileRoute, isRedirect, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/board")({
  head: () => ({
    meta: [
      { title: "Board Vote — MangaFlow" },
      { name: "description", content: "Board proposal voting, rankings, and at-risk decisions." },
    ],
  }),
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    let role: string | undefined;
    try {
      const raw = window.localStorage.getItem("beachread-auth");
      const parsed = raw ? (JSON.parse(raw) as { state?: { user?: { role?: string } } }) : null;
      role = parsed?.state?.user?.role;
    } catch (e) {
      if (isRedirect(e)) throw e;
    }
    if (role && role !== "board") {
      throw redirect({ to: "/app/dashboard" });
    }
  },
  component: () => <Outlet />,
});
