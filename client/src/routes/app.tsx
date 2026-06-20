import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { AppShell } from "@/layouts/AppShell";

export const Route = createFileRoute("/app")({
  validateSearch: z
    .object({
      redirect: z.string().optional(),
    })
    .partial()
    .optional()
    .catch({}),
  beforeLoad: ({ location }) => {
    // localStorage only exists in browser. During SSR, skip the check; the
    // component-side effect (or first client navigation) will redirect.
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("mangaflow.access_token");
    if (!token) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  head: () => ({
    meta: [
      { title: "MangaFlow — Production console" },
      {
        name: "description",
        content: "MangaFlow internal console for editors, mangaka, assistants and board.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
