import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ThemeProvider } from "@/shared/lib/theme";

export const Route = createFileRoute("/read")({
  head: () => ({
    meta: [
      { title: "Read on MangaFlow" },
      { name: "description", content: "Public reader for MangaFlow titles." },
    ],
  }),
  component: () => (
    <ThemeProvider>
      <div className="page-gradient min-h-screen text-foreground">
        <Outlet />
      </div>
    </ThemeProvider>
  ),
});
